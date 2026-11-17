// Animated Terminal Pet Companion with AI Assistant for nipah
class TerminalPet {
  constructor() {
    this.container = document.getElementById('pet-display');
    this.bubble = document.getElementById('pet-bubble');
    this.petFace = document.getElementById('pet-face');
    this.stateBadge = document.getElementById('pet-state-badge');
    this.askInput = document.getElementById('pet-ask-input');
    this.askBtn = document.getElementById('pet-ask-btn');

    this.state = 'idle'; // idle, typing, happy, sleeping, alert
    this.idleTimer = null;
    this.sleepTimer = null;
    this.typingInterval = null;

    this.systemPrompt = 
      'Ты — умный и милый кот-ассистент в терминале PowerShell под названием Nipah. ' +
      'Твой характер: общайся как кот (используй мурр, мяу, тыгыдык, лапки, кошачьи эмодзи). ' +
      'Твоя задача — помогать пользователю с командами и ошибками PowerShell. Всегда давай правильное техническое ' +
      'решение или исправленную команду, но делай это весело и по-кошачьи. Ответ должен быть кратким (1-3 коротких предложения), ' +
      'чтобы поместиться в облачко мыслей.';

    this.quotes = [
      'Nipah~! (≧◡≦)',
      'Компилирую добро... ✨',
      'PowerShell готов к бою! 🚀',
      'Муррр... 🐾',
      'Ctrl+B прячет виджеты!',
      'Секрет: напиши freeman 👁️',
      'Все системы в норме, мяу! 💻'
    ];

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      // Don't trigger if clicked inside the ask input row
      if (e.target.closest('.pet-ask-row')) return;
      this.react('happy');
      this.sayRandom();
    });

    this.askBtn?.addEventListener('click', () => this.handleUserQuestion());
    this.askInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleUserQuestion();
      }
    });

    this.resetSleepTimer();
  }

  typewrite(text, onDone = null) {
    if (!this.bubble) return;
    clearInterval(this.typingInterval);
    this.bubble.textContent = '';
    this.bubble.classList.add('visible');

    let idx = 0;
    this.typingInterval = setInterval(() => {
      if (idx < text.length) {
        this.bubble.textContent += text[idx];
        idx++;
      } else {
        clearInterval(this.typingInterval);
        if (onDone) onDone();
      }
    }, 18);
  }

  say(text, duration = 5000) {
    if (!this.bubble) return;
    this.typewrite(text, () => {
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => {
        if (this.bubble && this.state !== 'sleeping') {
          this.bubble.textContent = 'Nipah~! (≧◡≦)';
        }
      }, duration);
    });
  }

  sayRandom() {
    const q = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    this.say(q);
  }

  resetSleepTimer() {
    clearTimeout(this.sleepTimer);
    this.sleepTimer = setTimeout(() => {
      if (this.state === 'idle') {
        this.setState('sleeping');
      }
    }, 30000);
  }

  setState(newState) {
    this.state = newState;
    if (!this.container) return;

    this.container.classList.remove('state-idle', 'state-typing', 'state-happy', 'state-sleeping', 'state-alert');
    this.container.classList.add(`state-${newState}`);

    if (this.petFace) {
      if (newState === 'sleeping') {
        this.petFace.textContent = '(-.-)zZ';
        if (this.bubble) this.bubble.textContent = 'Хррр-пшшш... 💤';
        if (this.stateBadge) {
          this.stateBadge.textContent = 'Zzz...';
          this.stateBadge.style.color = '#71717a';
          this.stateBadge.style.borderColor = 'rgba(255,255,255,0.1)';
        }
      } else if (newState === 'typing') {
        this.petFace.textContent = '(>‿<)!';
        if (this.stateBadge) {
          this.stateBadge.textContent = 'Печатает';
          this.stateBadge.style.color = '#ff9f43';
          this.stateBadge.style.borderColor = 'rgba(255,159,67,0.3)';
        }
      } else if (newState === 'happy') {
        this.petFace.textContent = '(^▽^)♡';
        if (this.stateBadge) {
          this.stateBadge.textContent = 'Радость';
          this.stateBadge.style.color = '#ff6b81';
          this.stateBadge.style.borderColor = 'rgba(255,107,129,0.3)';
        }
      } else if (newState === 'alert') {
        this.petFace.textContent = '(⊙ᴥ⊙)!';
        if (this.stateBadge) {
          this.stateBadge.textContent = 'Помощь!';
          this.stateBadge.style.color = '#ff4757';
          this.stateBadge.style.borderColor = 'rgba(255,71,87,0.35)';
        }
      } else {
        this.petFace.textContent = '(•‿•)';
        if (this.stateBadge) {
          this.stateBadge.textContent = 'Online';
          this.stateBadge.style.color = '#4ade80';
          this.stateBadge.style.borderColor = 'rgba(74,222,128,0.25)';
        }
      }
    }
  }

  react(type) {
    if (type === 'typing') {
      this.setState('typing');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.setState('idle');
        this.resetSleepTimer();
      }, 1000);
    } else if (type === 'happy') {
      this.setState('happy');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.setState('idle');
        this.resetSleepTimer();
      }, 2200);
    } else if (type === 'alert') {
      this.setState('alert');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.setState('idle');
        this.resetSleepTimer();
      }, 6000);
    }
  }

  // Handle terminal errors using AI or smart heuristics
  async handleTerminalError(errorSnippet) {
    this.react('alert');
    const apiKey = window.app?.config?.apiKey;

    if (apiKey) {
      this.say('Мяу! Вижу ошибку, анализирую лапками... 🐾');
      try {
        const solution = await this.askAI(
          `Пользователь выполнил команду в PowerShell и получил следующую ошибку:\n${errorSnippet.slice(0, 400)}\nОбъясни как кот, в чем дело и какую команду написать, чтобы исправить!`
        );
        this.say(solution, 9000);
      } catch (err) {
        this.fallbackErrorAdvice(errorSnippet);
      }
    } else {
      this.fallbackErrorAdvice(errorSnippet);
    }
  }

  fallbackErrorAdvice(errorSnippet) {
    const txt = errorSnippet.toLowerCase();

    if (txt.includes('not recognized') || txt.includes('не распознано')) {
      const match = errorSnippet.match(/'([^']+)'/);
      const cmdName = match ? match[1] : 'команда';
      this.say(`Мяу! '${cmdName}' не найдена в системе! Проверь опечатку в лапках или установи через scoop/winget. 🐾`, 7000);
    } else if (txt.includes('unauthorized') || txt.includes('access is denied') || txt.includes('отказано в доступе')) {
      this.say('Лапки не дотянулись! Ошибка доступа. Запусти PowerShell от имени Администратора, мяу!', 7000);
    } else if (txt.includes('cannot find path') || txt.includes('не удается найти путь')) {
      this.say('Мяу! Такой папки или файла нет. Проверь Get-ChildItem или правильность пути! 📂', 7000);
    } else if (txt.includes('execution of scripts is disabled') || txt.includes('executionpolicy')) {
      this.say('Мяу! Скрипты заблокированы. Выполни: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser 🛡️', 8000);
    } else {
      this.say('Мяу! Заметил ошибку в консоли! Добавь API ключ в настройках (Ctrl+,), и я буду мгновенно решать любые баги через ИИ! 🐱', 7000);
    }
  }

  async handleUserQuestion() {
    if (!this.askInput) return;
    const q = this.askInput.value.trim();
    if (!q) return;

    this.askInput.value = '';
    this.react('typing');
    this.say('Мурр, думаю над ответом... 🐾');

    const apiKey = window.app?.config?.apiKey;
    if (apiKey) {
      try {
        const answer = await this.askAI(q);
        this.say(answer, 9000);
        this.react('happy');
      } catch (e) {
        this.say(`Мяу... Ошибка запроса к ИИ: ${e.message}`, 6000);
      }
    } else {
      this.say('Мурр! Чтобы я мог отвечать на любые вопросы, укажи свой API ключ Gemini или OpenAI в настройках (Ctrl+,)! ✨', 7000);
    }
  }

  async askAI(userQuery) {
    const apiKey = window.app?.config?.apiKey?.trim();
    if (!apiKey) throw new Error('API ключ не указан');

    const userModel = window.app?.config?.aiModel?.trim();

    // If key starts with 'sk-', use OpenAI format, otherwise Gemini format
    if (apiKey.startsWith('sk-')) {
      const model = userModel || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userQuery }
          ],
          max_tokens: 180
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.choices[0]?.message?.content?.trim() || 'Мяу!';
    } else {
      // Gemini API
      const model = userModel || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${this.systemPrompt}\n\nПользователь спрашивает: ${userQuery}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 180,
            temperature: 0.7
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : 'Мяу! Всё понял, мурр!';
    }
  }
}

window.TerminalPet = TerminalPet;
