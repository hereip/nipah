const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, '../../debug.log');
function log(msg) {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch(e){}
}
process.on('uncaughtException', (err) => log('Uncaught: ' + err.stack));
process.on('unhandledRejection', (err) => log('Unhandled: ' + (err?.stack || err)));
log('Nipah starting...');

const PtyManager = require('./pty-manager');
const { getSystemMetrics, getGitStatus } = require('./system-info');

let mainWindow = null;
let ptyManager = null;
let metricsInterval = null;

const configPath = path.join(app.getPath('userData'), 'nipah-config.json');

const defaultConfig = {
  theme: 'fluent-dark',
  material: 'mica',
  opacity: 0.95,
  fontFamily: 'Cascadia Code, Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: 'bar',
  cursorBlink: true,
  showWidgets: true,
  widgets: {
    systemMonitor: true,
    clock: true,
    snippets: true,
    git: true
  },
  snippets: [
    { title: 'Clear', cmd: 'Clear-Host' },
    { title: 'Fastfetch', cmd: 'fastfetch' },
    { title: 'Git Status', cmd: 'git status' },
    { title: 'List Files', cmd: 'Get-ChildItem' },
    { title: 'IP Info', cmd: 'Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, InterfaceAlias' }
  ]
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return defaultConfig;
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving config:', e);
    return false;
  }
}

function createWindow() {
  const cfg = loadConfig();

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 750,
    minWidth: 780,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#00000000',
    backgroundMaterial: cfg.material === 'acrylic' ? 'acrylic' : 'mica',
    roundedCorners: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  ptyManager = new PtyManager(mainWindow);

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show triggered, showing mainWindow');
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('webContents did-finish-load');
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    log(`webContents did-fail-load: ${code} ${desc}`);
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-change', false);
  });

  mainWindow.on('closed', () => {
    if (metricsInterval) clearInterval(metricsInterval);
    if (ptyManager) ptyManager.destroy();
    mainWindow = null;
  });

  // Start system metrics loop (every 1.5 seconds)
  metricsInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('system-metrics-update', getSystemMetrics());
    }
  }, 1500);
}

app.whenReady().then(() => {
  log('app is ready, calling createWindow');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Setup
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize-toggle', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() || false);

// PTY IPC
ipcMain.handle('pty-create', (event, { id, cols, rows, cwd }) => {
  ptyManager.createSession(id, cols, rows, cwd);
  return true;
});
ipcMain.handle('pty-write', (event, { id, data }) => {
  ptyManager.write(id, data);
  return true;
});
ipcMain.handle('pty-resize', (event, { id, cols, rows }) => {
  ptyManager.resize(id, cols, rows);
  return true;
});
ipcMain.handle('pty-kill', (event, { id }) => {
  ptyManager.kill(id);
  return true;
});

// Config IPC
ipcMain.handle('config-load', () => loadConfig());
ipcMain.handle('config-save', (event, newConfig) => {
  const ok = saveConfig(newConfig);
  if (ok && mainWindow && newConfig.material) {
    mainWindow.setBackgroundMaterial(newConfig.material === 'acrylic' ? 'acrylic' : 'mica');
  }
  return ok;
});

// System & Git
ipcMain.handle('git-status', (event, cwd) => getGitStatus(cwd));
ipcMain.handle('open-external', (event, url) => shell.openExternal(url));
