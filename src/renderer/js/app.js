// Main Application Orchestrator for nipah
class NipahApp {
  constructor() {
    this.config = null;
    this.sessions = new Map();
    this.activeTabId = null;
    this.tabCounter = 0;
    this.widgetManager = null;
    this.pet = null;

    // DOM Elements
    this.tabBar = document.getElementById('tab-bar');
    this.btnNewTab = document.getElementById('btn-new-tab');
    this.terminalArea = document.getElementById('terminal-area');
    this.widgetsSidebar = document.getElementById('widgets-sidebar');
    this.btnToggleWidgets = document.getElementById('btn-toggle-widgets');
    this.btnSettings = document.getElementById('btn-settings');
    this.settingsModal = document.getElementById('settings-modal');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.appContainer = document.getElementById('app-container');

    // Window controls
    this.btnWinMin = document.getElementById('win-min');
    this.btnWinMax = document.getElementById('win-max');
    this.btnWinClose = document.getElementById('win-close');
  }

  async init() {
    this.config = await window.nipah.config.load();

    // Set defaults if missing
    if (!this.config.widgets) {
      this.config.widgets = {
        systemMonitor: true,
        clock: true,
        snippets: true,
        git: true,
        pet: true
      };
    }

    this.applyTheme(this.config.theme || 'fluent-dark');
    this.applyOpacity(this.config.opacity || 0.92);

    // Initialize pet
    this.pet = new TerminalPet();

    // Initialize widgets
    this.widgetManager = new WidgetManager(this);

    this.bindWindowControls();
    this.bindTabEvents();
    this.bindSettingsEvents();
    this.bindHotkeys();

    // Request notification permissions
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Create initial terminal tab
    this.createTab();

    // Set initial sidebar state
    if (!this.config.showWidgets) {
      this.widgetsSidebar.classList.add('collapsed');
      this.btnToggleWidgets.classList.remove('active');
    }
  }

  bindWindowControls() {
    this.btnWinMin?.addEventListener('click', () => window.nipah.window.minimize());
    this.btnWinMax?.addEventListener('click', () => window.nipah.window.maximizeToggle());
    this.btnWinClose?.addEventListener('click', () => window.nipah.window.close());

    window.nipah.window.onMaximizedChange((isMax) => {
      if (this.btnWinMax) {
        this.btnWinMax.innerHTML = isMax ? '&#x2750;' : '&#x25A2;';
      }
    });

    this.btnToggleWidgets?.addEventListener('click', () => {
      this.toggleWidgets();
    });
  }

  toggleWidgets() {
    const isCollapsed = this.widgetsSidebar.classList.toggle('collapsed');
    this.btnToggleWidgets.classList.toggle('active', !isCollapsed);
    this.config.showWidgets = !isCollapsed;
    window.nipah.config.save(this.config);

    // Re-fit active terminal
    setTimeout(() => {
      const activeSession = this.getActiveSession();
      if (activeSession) activeSession.fit();
    }, 320);
  }

  createTab(title = 'PowerShell') {
    this.tabCounter++;
    const tabId = `tab-${this.tabCounter}`;

    // Create Tab element in header
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-item';
    tabEl.id = `tab-header-${tabId}`;
    tabEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
      </svg>
      <span class="tab-title">${title}</span>
      <button class="tab-close" title="Закрыть вкладку">&times;</button>
    `;

    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.switchTab(tabId);
      }
    });

    const closeBtn = tabEl.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });

    // Insert before "+" button
    this.tabBar.insertBefore(tabEl, this.btnNewTab);

    // Create Terminal pane in container
    const paneEl = document.createElement('div');
    paneEl.className = 'terminal-pane';
    paneEl.id = `tab-pane-${tabId}`;
    this.terminalArea.appendChild(paneEl);

    // Initialize Terminal Session
    const session = new TerminalSession(tabId, paneEl, this.config);
    this.sessions.set(tabId, session);

    // Activate tab
    this.switchTab(tabId);

    // Handle PTY exit
    window.nipah.pty.onExit(tabId, () => {
      this.closeTab(tabId);
    });

    return tabId;
  }

  switchTab(tabId) {
    if (!this.sessions.has(tabId)) return;

    // Remove active from all tabs
    document.querySelectorAll('.tab-item').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.terminal-pane').forEach((el) => el.classList.remove('active'));

    // Activate chosen tab
    const tabHeader = document.getElementById(`tab-header-${tabId}`);
    const tabPane = document.getElementById(`tab-pane-${tabId}`);

    if (tabHeader) tabHeader.classList.add('active');
    if (tabPane) tabPane.classList.add('active');

    this.activeTabId = tabId;

    const session = this.sessions.get(tabId);
    if (session) {
      session.fit();
      session.term.focus();
    }
  }

  closeTab(tabId) {
    const session = this.sessions.get(tabId);
    if (!session) return;

    session.destroy();
    this.sessions.delete(tabId);

    const tabHeader = document.getElementById(`tab-header-${tabId}`);
    const tabPane = document.getElementById(`tab-pane-${tabId}`);
    if (tabHeader) tabHeader.remove();
    if (tabPane) tabPane.remove();

    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.sessions.keys());
      if (remainingTabs.length > 0) {
        this.switchTab(remainingTabs[remainingTabs.length - 1]);
      } else {
        this.createTab();
      }
    }
  }

  getActiveSession() {
    return this.sessions.get(this.activeTabId);
  }

  bindTabEvents() {
    this.btnNewTab?.addEventListener('click', () => {
      this.createTab();
    });
  }

  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    const isLight = themeName === 'fluent-light';
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
    this.config.theme = themeName;
    for (const session of this.sessions.values()) {
      session.applyConfig(this.config);
    }
  }

  applyOpacity(opacity) {
    this.config.opacity = opacity;
    document.documentElement.style.setProperty('--window-opacity', opacity);
  }

  triggerSecretCombineTheme() {
    // 1. Activate theme
    this.applyTheme('combine');
    this.config.theme = 'combine';
    window.nipah.config.save(this.config);

    // 2. Play Combine Overwatch chime via Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}

    // 3. Glitch animation
    if (this.appContainer) {
      this.appContainer.classList.add('combine-glitch-active');
      setTimeout(() => this.appContainer.classList.remove('combine-glitch-active'), 550);
    }

    // 4. Pet reaction
    if (this.pet) {
      this.pet.say('👁️ ВНИМАНИЕ: СЕКТОР АЛЬЯНСА АКТИВИРОВАН!');
      this.pet.react('happy');
    }

    // 5. Active terminal feedback
    const activeSession = this.getActiveSession();
    if (activeSession) {
      activeSession.term.write(
        '\r\n\x1b[1;36m[OVERWATCH DISPATCH]:\x1b[0m \x1b[33mAttention, Ground Units. Freeman protocol acknowledged. Combine Terminal theme online.\x1b[0m\r\n'
      );
    }
  }

  bindSettingsEvents() {
    this.btnSettings?.addEventListener('click', () => {
      this.openSettings();
    });

    this.btnCloseSettings?.addEventListener('click', () => {
      this.settingsModal.classList.remove('active');
    });

    this.btnSaveSettings?.addEventListener('click', () => {
      this.saveSettings();
    });

    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.settingsModal.classList.remove('active');
      }
    });

    // Live theme preview
    const themeSelect = document.getElementById('setting-theme');
    themeSelect?.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    // Live opacity preview
    const opacityRange = document.getElementById('setting-opacity');
    const opacityVal = document.getElementById('setting-opacity-val');
    opacityRange?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (opacityVal) opacityVal.textContent = `${Math.round(val * 100)}%`;
      this.applyOpacity(val);
    });
  }

  openSettings() {
    // Populate form
    document.getElementById('setting-theme').value = this.config.theme || 'fluent-dark';
    document.getElementById('setting-material').value = this.config.material || 'mica';
    document.getElementById('setting-opacity').value = this.config.opacity || 0.92;
    document.getElementById('setting-opacity-val').textContent = `${Math.round((this.config.opacity || 0.92) * 100)}%`;
    document.getElementById('setting-font').value = this.config.fontFamily || 'Cascadia Code, Consolas, monospace';
    document.getElementById('setting-fontsize').value = this.config.fontSize || 14;
    document.getElementById('setting-cursor').value = this.config.cursorStyle || 'bar';
    document.getElementById('setting-cursor-blink').checked = this.config.cursorBlink !== false;
    document.getElementById('setting-apikey').value = this.config.apiKey || '';
    document.getElementById('setting-aimodel').value = this.config.aiModel || '';
    document.getElementById('setting-typewriter').checked = this.config.typewriterMode === true;

    // Widget checkboxes
    const w = this.config.widgets || {};
    document.getElementById('widget-toggle-system').checked = w.systemMonitor !== false;
    document.getElementById('widget-toggle-clock').checked = w.clock !== false;
    document.getElementById('widget-toggle-snippets').checked = w.snippets !== false;
    document.getElementById('widget-toggle-git').checked = w.git !== false;
    document.getElementById('widget-toggle-pet').checked = w.pet !== false;

    this.settingsModal.classList.add('active');
  }

  async saveSettings() {
    this.config.theme = document.getElementById('setting-theme').value;
    this.config.material = document.getElementById('setting-material').value;
    this.config.opacity = parseFloat(document.getElementById('setting-opacity').value);
    this.config.fontFamily = document.getElementById('setting-font').value;
    this.config.fontSize = parseInt(document.getElementById('setting-fontsize').value, 10);
    this.config.cursorStyle = document.getElementById('setting-cursor').value;
    this.config.cursorBlink = document.getElementById('setting-cursor-blink').checked;
    this.config.apiKey = document.getElementById('setting-apikey').value.trim();
    this.config.aiModel = document.getElementById('setting-aimodel').value.trim();
    this.config.typewriterMode = document.getElementById('setting-typewriter').checked;

    this.config.widgets = {
      systemMonitor: document.getElementById('widget-toggle-system').checked,
      clock: document.getElementById('widget-toggle-clock').checked,
      snippets: document.getElementById('widget-toggle-snippets').checked,
      git: document.getElementById('widget-toggle-git').checked,
      pet: document.getElementById('widget-toggle-pet').checked
    };

    await window.nipah.config.save(this.config);

    this.applyTheme(this.config.theme);
    this.applyOpacity(this.config.opacity);

    if (this.widgetManager) {
      this.widgetManager.applyWidgetVisibilities();
    }

    for (const session of this.sessions.values()) {
      session.applyConfig(this.config);
    }

    this.settingsModal.classList.remove('active');
  }

  bindHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Ctrl + T : New Tab
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.createTab();
      }
      // Ctrl + W : Close Tab
      else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      }
      // Ctrl + Tab : Next Tab
      else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const tabIds = Array.from(this.sessions.keys());
        if (tabIds.length > 1) {
          const idx = tabIds.indexOf(this.activeTabId);
          const nextIdx = e.shiftKey
            ? (idx - 1 + tabIds.length) % tabIds.length
            : (idx + 1) % tabIds.length;
          this.switchTab(tabIds[nextIdx]);
        }
      }
      // Ctrl + , : Settings
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        this.openSettings();
      }
      // Ctrl + B : Toggle Widgets
      else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleWidgets();
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NipahApp();
  window.app.init();
});
