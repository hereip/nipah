const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nipah', {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximizeToggle: () => ipcRenderer.invoke('window-maximize-toggle'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizedChange: (callback) => {
      const listener = (_e, val) => callback(val);
      ipcRenderer.on('window-maximized-change', listener);
      return () => ipcRenderer.removeListener('window-maximized-change', listener);
    }
  },
  pty: {
    create: (options) => ipcRenderer.invoke('pty-create', options),
    write: (id, data) => ipcRenderer.invoke('pty-write', { id, data }),
    resize: (id, cols, rows) => ipcRenderer.invoke('pty-resize', { id, cols, rows }),
    kill: (id) => ipcRenderer.invoke('pty-kill', { id }),
    onData: (id, callback) => {
      const channel = `pty-data-${id}`;
      const listener = (_e, data) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    onExit: (id, callback) => {
      const channel = `pty-exit-${id}`;
      const listener = (_e, info) => callback(info);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
  },
  system: {
    onMetricsUpdate: (callback) => {
      const listener = (_e, metrics) => callback(metrics);
      ipcRenderer.on('system-metrics-update', listener);
      return () => ipcRenderer.removeListener('system-metrics-update', listener);
    },
    getGitStatus: (cwd) => ipcRenderer.invoke('git-status', cwd)
  },
  config: {
    load: () => ipcRenderer.invoke('config-load'),
    save: (cfg) => ipcRenderer.invoke('config-save', cfg)
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
