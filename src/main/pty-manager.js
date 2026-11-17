const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const readline = require('readline');

class PtyManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.sessions = new Map();
    this.worker = null;
    this.directPty = null;
    this.useWorker = false;

    this.init();
  }

  init() {
    try {
      this.directPty = require('node-pty');
      console.log('[nipah] Direct node-pty loaded successfully in Electron main.');
    } catch (e) {
      console.log('[nipah] Native ABI mismatch or error in Electron. Spawning Node.js PTY worker fallback:', e.message);
      this.useWorker = true;
      this.spawnWorker();
    }
  }

  spawnWorker() {
    const workerScript = path.join(__dirname, 'pty-worker.js');
    this.worker = spawn('node', [workerScript], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true
    });

    const rl = readline.createInterface({
      input: this.worker.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      try {
        const msg = JSON.parse(line);
        if (msg.event === 'data') {
          if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(`pty-data-${msg.id}`, msg.data);
          }
        } else if (msg.event === 'exit') {
          if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(`pty-exit-${msg.id}`, {
              exitCode: msg.exitCode,
              signal: msg.signal
            });
          }
          this.sessions.delete(msg.id);
        }
      } catch (err) {
        console.error('[nipah-worker-parse-err]', err);
      }
    });

    this.worker.on('exit', () => {
      console.log('[nipah] PTY worker exited');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        // Restart worker if main window is still open
        setTimeout(() => this.spawnWorker(), 1000);
      }
    });
  }

  createSession(id, cols = 80, rows = 24, cwd = os.homedir()) {
    if (this.useWorker) {
      this.worker.stdin.write(JSON.stringify({
        action: 'create',
        id,
        cols,
        rows,
        cwd
      }) + '\n');
      this.sessions.set(id, { id, cwd });
      return;
    }

    try {
      const shell = process.env.SHELL || 'powershell.exe';
      const proc = this.directPty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: process.env
      });

      this.sessions.set(id, proc);

      proc.onData((data) => {
        if (!this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(`pty-data-${id}`, data);
        }
      });

      proc.onExit(({ exitCode, signal }) => {
        if (!this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(`pty-exit-${id}`, { exitCode, signal });
        }
        this.sessions.delete(id);
      });
    } catch (err) {
      console.error('[nipah-direct-pty-failed]', err.message);
      // Fallback to worker if direct spawn failed
      this.useWorker = true;
      this.spawnWorker();
      setTimeout(() => this.createSession(id, cols, rows, cwd), 300);
    }
  }

  write(id, data) {
    if (this.useWorker) {
      if (this.worker && this.worker.stdin.writable) {
        this.worker.stdin.write(JSON.stringify({ action: 'write', id, data }) + '\n');
      }
      return;
    }

    const proc = this.sessions.get(id);
    if (proc && typeof proc.write === 'function') {
      proc.write(data);
    }
  }

  resize(id, cols, rows) {
    if (cols <= 0 || rows <= 0) return;
    if (this.useWorker) {
      if (this.worker && this.worker.stdin.writable) {
        this.worker.stdin.write(JSON.stringify({ action: 'resize', id, cols, rows }) + '\n');
      }
      return;
    }

    const proc = this.sessions.get(id);
    if (proc && typeof proc.resize === 'function') {
      try {
        proc.resize(cols, rows);
      } catch (e) {}
    }
  }

  kill(id) {
    if (this.useWorker) {
      if (this.worker && this.worker.stdin.writable) {
        this.worker.stdin.write(JSON.stringify({ action: 'kill', id }) + '\n');
      }
      this.sessions.delete(id);
      return;
    }

    const proc = this.sessions.get(id);
    if (proc && typeof proc.kill === 'function') {
      try {
        proc.kill();
      } catch (e) {}
      this.sessions.delete(id);
    }
  }

  destroy() {
    if (this.worker) {
      try { this.worker.kill(); } catch (e) {}
    }
    for (const [id, proc] of this.sessions.entries()) {
      if (proc && typeof proc.kill === 'function') {
        try { proc.kill(); } catch (e) {}
      }
    }
    this.sessions.clear();
  }
}

module.exports = PtyManager;
