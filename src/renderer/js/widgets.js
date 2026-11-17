// Widgets module for nipah with dynamic visibility & snippet management
class WidgetManager {
  constructor(app) {
    this.app = app;

    // DOM Elements
    this.cpuFill = document.getElementById('cpu-gauge-fill');
    this.cpuVal = document.getElementById('cpu-gauge-val');
    this.cpuCores = document.getElementById('cpu-gauge-cores');

    this.ramFill = document.getElementById('ram-gauge-fill');
    this.ramVal = document.getElementById('ram-gauge-val');
    this.ramUsed = document.getElementById('ram-gauge-used');

    this.clockTime = document.getElementById('clock-time');
    this.clockDate = document.getElementById('clock-date');
    this.clockUptime = document.getElementById('clock-uptime');

    this.gitBranch = document.getElementById('git-branch');
    this.gitChanges = document.getElementById('git-changes');

    // Cards
    this.cardClock = document.getElementById('widget-clock');
    this.cardSystem = document.getElementById('widget-system');
    this.cardSnippets = document.getElementById('widget-snippets');
    this.cardGit = document.getElementById('widget-git');
    this.cardPet = document.getElementById('widget-pet');

    this.snippetsContainer = document.getElementById('snippets-list');
    this.btnAddSnippet = document.getElementById('btn-add-snippet');

    this.initClock();
    this.initSystemMetrics();
    this.initSnippets();
    this.applyWidgetVisibilities();
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      if (this.clockTime) {
        this.clockTime.textContent = `${hours}:${minutes}:${seconds}`;
      }

      if (this.clockDate) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        this.clockDate.textContent = now.toLocaleDateString('ru-RU', options);
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  initSystemMetrics() {
    window.nipah.system.onMetricsUpdate((m) => {
      // Update CPU
      const cpuPercent = m.cpu.percent || 0;
      if (this.cpuVal) this.cpuVal.textContent = `${cpuPercent}%`;
      if (this.cpuCores) this.cpuCores.textContent = `${m.cpu.cores} ядер`;
      this.setCircleGauge(this.cpuFill, cpuPercent);

      // Update RAM
      const ramPercent = m.memory.percent || 0;
      if (this.ramVal) this.ramVal.textContent = `${ramPercent}%`;
      if (this.ramUsed) this.ramUsed.textContent = `${m.memory.usedGB} / ${m.memory.totalGB} GB`;
      this.setCircleGauge(this.ramFill, ramPercent);

      // Update Uptime
      if (this.clockUptime) {
        this.clockUptime.textContent = `Аптайм: ${m.uptime}`;
      }
    });
  }

  setCircleGauge(el, percent) {
    if (!el) return;
    const maxOffset = 200;
    const offset = maxOffset - (maxOffset * percent) / 100;
    el.style.strokeDashoffset = Math.max(0, offset);
  }

  renderSnippets(snippets) {
    if (!this.snippetsContainer) return;
    this.snippetsContainer.innerHTML = '';

    (snippets || []).forEach((snip, index) => {
      const btn = document.createElement('button');
      btn.className = 'snippet-chip';
      btn.title = `${snip.cmd} (Правый клик для удаления)`;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>${snip.title}</span>
      `;

      btn.addEventListener('click', () => {
        const activeTab = this.app.getActiveSession();
        if (activeTab) {
          activeTab.sendCommand(snip.cmd);
          if (this.app.pet) {
            this.app.pet.say(`Запускаю: ${snip.title}!`);
            this.app.pet.react('typing');
          }
        }
      });

      // Right click to delete snippet
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm(`Удалить быстрый сниппет "${snip.title}"?`)) {
          this.removeSnippet(index);
        }
      });

      this.snippetsContainer.appendChild(btn);
    });
  }

  initSnippets() {
    this.renderSnippets(this.app.config.snippets);

    this.btnAddSnippet?.addEventListener('click', () => {
      const title = prompt('Название сниппета (например, Ping):');
      if (!title) return;
      const cmd = prompt('Команда PowerShell (например, Test-Connection 8.8.8.8):');
      if (!cmd) return;

      if (!this.app.config.snippets) this.app.config.snippets = [];
      this.app.config.snippets.push({ title, cmd });
      window.nipah.config.save(this.app.config);
      this.renderSnippets(this.app.config.snippets);

      if (this.app.pet) this.app.pet.say('Новый сниппет добавлен!');
    });
  }

  removeSnippet(index) {
    if (this.app.config.snippets) {
      this.app.config.snippets.splice(index, 1);
      window.nipah.config.save(this.app.config);
      this.renderSnippets(this.app.config.snippets);
    }
  }

  applyWidgetVisibilities() {
    const w = this.app.config.widgets || {};

    if (this.cardClock) this.cardClock.style.display = w.clock !== false ? 'flex' : 'none';
    if (this.cardSystem) this.cardSystem.style.display = w.systemMonitor !== false ? 'flex' : 'none';
    if (this.cardSnippets) this.cardSnippets.style.display = w.snippets !== false ? 'flex' : 'none';
    if (this.cardPet) this.cardPet.style.display = w.pet !== false ? 'flex' : 'none';

    // Git visibility will be handled by updateGitStatus
    if (this.cardGit && w.git === false) {
      this.cardGit.style.display = 'none';
    }
  }

  updateGitStatus(cwd) {
    if (this.app.config.widgets?.git === false) {
      if (this.cardGit) this.cardGit.style.display = 'none';
      return;
    }

    window.nipah.system.getGitStatus(cwd || '').then((status) => {
      if (!this.cardGit) return;
      if (status.isRepo) {
        this.cardGit.style.display = 'flex';
        if (this.gitBranch) this.gitBranch.textContent = status.branch;
        if (this.gitChanges) {
          this.gitChanges.textContent = status.changesCount > 0 
            ? `${status.changesCount} изм.` 
            : 'Чисто';
        }
      } else {
        this.cardGit.style.display = 'none';
      }
    });
  }
}

window.WidgetManager = WidgetManager;
