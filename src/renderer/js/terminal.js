// Terminal manager for nipah with dynamic theme engine, error detector & typewriter mode
const TerminalThemes = {
  'fluent-dark': {
    background: '#00000000',
    foreground: '#f4f4f5',
    cursor: '#60cdff',
    cursorAccent: '#18181b',
    selectionBackground: 'rgba(96, 205, 255, 0.35)',
    black: '#18181b',
    red: '#f87171',
    green: '#4ade80',
    yellow: '#facc15',
    blue: '#60cdff',
    magenta: '#c084fc',
    cyan: '#38bdf8',
    white: '#f4f4f5',
    brightBlack: '#71717a',
    brightRed: '#ef4444',
    brightGreen: '#22c55e',
    brightYellow: '#eab308',
    brightBlue: '#38bdf8',
    brightMagenta: '#a855f7',
    brightCyan: '#0ea5e9',
    brightWhite: '#ffffff'
  },
  'fluent-light': {
    background: '#00000000',
    foreground: '#0f172a',
    cursor: '#0067c0',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(0, 103, 192, 0.28)',
    black: '#0f172a',
    red: '#dc2626',
    green: '#16a34a',
    yellow: '#b45309',
    blue: '#0284c7',
    magenta: '#9333ea',
    cyan: '#0891b2',
    white: '#334155',
    brightBlack: '#64748b',
    brightRed: '#b91c1c',
    brightGreen: '#15803d',
    brightYellow: '#92400e',
    brightBlue: '#0369a1',
    brightMagenta: '#7e22ce',
    brightCyan: '#0e7490',
    brightWhite: '#0f172a'
  },
  'nord': {
    background: '#00000000',
    foreground: '#eceff4',
    cursor: '#88c0d0',
    cursorAccent: '#2e3440',
    selectionBackground: 'rgba(136, 192, 208, 0.35)',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4'
  },
  'tokyo-night': {
    background: '#00000000',
    foreground: '#c0caf5',
    cursor: '#7aa2f7',
    cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(122, 162, 247, 0.35)',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5'
  },
  'catppuccin': {
    background: '#00000000',
    foreground: '#cdd6f4',
    cursor: '#cba6f7',
    cursorAccent: '#1e1e2e',
    selectionBackground: 'rgba(203, 166, 247, 0.35)',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8'
  },
  'cyberpunk': {
    background: '#00000000',
    foreground: '#00f0ff',
    cursor: '#ff0055',
    cursorAccent: '#0d0e1b',
    selectionBackground: 'rgba(0, 240, 255, 0.4)',
    black: '#0d0e1b',
    red: '#ff0055',
    green: '#00ff66',
    yellow: '#ffe600',
    blue: '#00f0ff',
    magenta: '#ff00aa',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#2a2b45',
    brightRed: '#ff2a75',
    brightGreen: '#33ff88',
    brightYellow: '#ffee33',
    brightBlue: '#33f3ff',
    brightMagenta: '#ff33bb',
    brightCyan: '#33ffff',
    brightWhite: '#ffffff'
  },
  'combine': {
    background: '#00000000',
    foreground: '#38efdb',
    cursor: '#ff7700',
    cursorAccent: '#081014',
    selectionBackground: 'rgba(56, 239, 219, 0.4)',
    black: '#081014',
    red: '#ff3344',
    green: '#00ffcc',
    yellow: '#ffaa00',
    blue: '#38efdb',
    magenta: '#b86bff',
    cyan: '#00e5ff',
    white: '#c6fcf6',
    brightBlack: '#234a54',
    brightRed: '#ff5566',
    brightGreen: '#33ffdd',
    brightYellow: '#ffcc33',
    brightBlue: '#66f5e8',
    brightMagenta: '#d099ff',
    brightCyan: '#33eeff',
    brightWhite: '#ffffff'
  }
};

class TerminalSession {
  constructor(id, container, config) {
    this.id = id;
    this.container = container;
    this.config = config;
    this.term = null;
    this.fitAddon = null;
    this.removeDataListener = null;
    this.removeExitListener = null;

    // Command tracking & easter egg
    this.inputLine = '';
    this.commandRunning = false;
    this.commandStartTime = null;

    // Error capture buffer
    this.errorBuffer = '';
    this.errorTimer = null;

    // Typewriter queue
    this.typewriterQueue = [];
    this.isTypingQueue = false;

    this.init();
  }

  init() {
    const themeName = this.config.theme || 'fluent-dark';
    const theme = TerminalThemes[themeName] || TerminalThemes['fluent-dark'];

    this.term = new Terminal({
      cursorBlink: this.config.cursorBlink !== false,
      cursorStyle: this.config.cursorStyle || 'bar',
      fontSize: this.config.fontSize || 14,
      fontFamily: this.config.fontFamily || 'Cascadia Code, Consolas, monospace',
      lineHeight: this.config.lineHeight || 1.2,
      theme: { ...theme },
      allowTransparency: true,
      scrollback: 5000,
      convertEol: true,
      windowsMode: true
    });

    const FitClass = (typeof FitAddon === 'function') ? FitAddon : (FitAddon?.FitAddon || FitAddon);
    this.fitAddon = new FitClass();
    this.term.loadAddon(this.fitAddon);

    this.term.open(this.container);

    // Initial fit
    requestAnimationFrame(() => {
      this.fit();
      const dims = this.getDimensions();
      window.nipah.pty.create({
        id: this.id,
        cols: dims.cols,
        rows: dims.rows
      });
    });

    // PTY output -> Terminal
    this.removeDataListener = window.nipah.pty.onData(this.id, (data) => {
      // Check for errors in output
      this.inspectForErrors(data);

      // Write to xterm (with optional typewriter micro-stream)
      if (this.config.typewriterMode && data.length > 5 && !data.includes('\x1b[')) {
        this.queueTypewriter(data);
      } else {
        this.term.write(data);
      }

      // Check for prompt return (command finished)
      if (this.commandRunning && (data.includes('PS ') || data.includes('> '))) {
        const elapsed = Date.now() - this.commandStartTime;
        this.commandRunning = false;

        // Trigger pet happy reaction if no errors
        if (window.app && window.app.pet && !this.errorBuffer) {
          window.app.pet.react('happy');
        }

        // Notify if took longer than 2.5 seconds and window not focused
        if (elapsed > 2500 && (!document.hasFocus() || window.app.activeTabId !== this.id)) {
          this.notifyCommandDone();
        }
      }
    });

    // Terminal user input -> PTY
    this.term.onData((data) => {
      window.nipah.pty.write(this.id, data);

      // Trigger pet typing
      if (window.app && window.app.pet) {
        window.app.pet.react('typing');
      }

      // Track input line for 'freeman' easter egg and command timing
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        if (char === '\r' || char === '\n') {
          const cmd = this.inputLine.trim().toLowerCase();
          if (cmd === 'freeman') {
            if (window.app && typeof window.app.triggerSecretCombineTheme === 'function') {
              window.app.triggerSecretCombineTheme();
            }
          }
          if (this.inputLine.trim().length > 0) {
            this.commandRunning = true;
            this.commandStartTime = Date.now();
            this.errorBuffer = '';
          }
          this.inputLine = '';
        } else if (char === '\u007F' || char === '\b') {
          this.inputLine = this.inputLine.slice(0, -1);
        } else if (char.length === 1 && char >= ' ') {
          this.inputLine += char;
        }
      }
    });

    // Copy on selection, paste on right click
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        if (text) window.nipah.pty.write(this.id, text);
      });
    });

    // Handle resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.fit();
    });
    this.resizeObserver.observe(this.container);
  }

  inspectForErrors(data) {
    // Detect standard PowerShell error patterns
    const isError =
      data.includes('CategoryInfo') ||
      data.includes('FullyQualifiedErrorId') ||
      data.includes('not recognized as the name of a cmdlet') ||
      data.includes('не распознано как имя') ||
      data.includes('Cannot find path') ||
      data.includes('UnauthorizedAccessException') ||
      data.includes('CommandNotFoundException') ||
      data.includes('ParserError');

    if (isError) {
      this.errorBuffer += ' ' + data.replace(/\x1b\[[0-9;]*m/g, '').trim();

      clearTimeout(this.errorTimer);
      this.errorTimer = setTimeout(() => {
        if (this.errorBuffer && window.app && window.app.pet) {
          window.app.pet.handleTerminalError(this.errorBuffer);
          this.errorBuffer = '';
        }
      }, 700);
    }
  }

  queueTypewriter(text) {
    this.typewriterQueue.push(text);
    if (!this.isTypingQueue) {
      this.processTypewriterQueue();
    }
  }

  processTypewriterQueue() {
    if (this.typewriterQueue.length === 0) {
      this.isTypingQueue = false;
      return;
    }

    this.isTypingQueue = true;
    const chunk = this.typewriterQueue.shift();
    const chars = chunk.split('');
    let idx = 0;

    const step = () => {
      if (idx < chars.length) {
        const take = chars.slice(idx, idx + 4).join('');
        this.term.write(take);
        idx += 4;
        requestAnimationFrame(step);
      } else {
        this.processTypewriterQueue();
      }
    };
    step();
  }

  notifyCommandDone() {
    if (Notification.permission === 'granted') {
      new Notification('nipah terminal', {
        body: 'Команда завершила выполнение!',
        silent: false
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  fit() {
    if (!this.fitAddon || !this.container.clientWidth || !this.container.clientHeight) return;
    try {
      this.fitAddon.fit();
      const dims = this.getDimensions();
      if (dims.cols > 0 && dims.rows > 0) {
        window.nipah.pty.resize(this.id, dims.cols, dims.rows);
      }
    } catch (e) {
      // ignore
    }
  }

  getDimensions() {
    return {
      cols: this.term ? this.term.cols : 80,
      rows: this.term ? this.term.rows : 24
    };
  }

  write(data) {
    window.nipah.pty.write(this.id, data);
  }

  sendCommand(cmd) {
    window.nipah.pty.write(this.id, cmd + '\r');
  }

  applyConfig(cfg) {
    this.config = cfg;
    if (!this.term) return;

    const themeName = cfg.theme || 'fluent-dark';
    const theme = TerminalThemes[themeName] || TerminalThemes['fluent-dark'];

    this.term.options.theme = { ...theme };
    this.term.options.fontSize = cfg.fontSize || 14;
    this.term.options.fontFamily = cfg.fontFamily || 'Cascadia Code, Consolas, monospace';
    this.term.options.cursorStyle = cfg.cursorStyle || 'bar';
    this.term.options.cursorBlink = cfg.cursorBlink !== false;

    // Force redraw
    this.term.refresh(0, Math.max(0, this.term.rows - 1));
    this.fit();
  }

  destroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.removeDataListener) this.removeDataListener();
    if (this.removeExitListener) this.removeExitListener();
    window.nipah.pty.kill(this.id);
    if (this.term) this.term.dispose();
  }
}

window.TerminalThemes = TerminalThemes;
window.TerminalSession = TerminalSession;
