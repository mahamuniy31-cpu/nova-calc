/**
 * NOVA CALC - Main Application Controller
 * 
 * Orchestrates UI interactions, Web Audio sound effects, keyboard navigation,
 * history panel, settings modal, toast notifications, and responsive display scaling.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type = 'click') {
    if (!this.enabled) return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      switch (type) {
        case 'click': // Subtle high-end tactile tap for numbers
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.start(now);
          osc.stop(now + 0.035);
          break;

        case 'operator': // Crisp mechanical click with slight harmonic
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.045);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          osc.start(now);
          osc.stop(now + 0.045);
          break;

        case 'equals': // Pleasant futuristic completion chord (two frequencies)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);

          // Sub harmonic
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.frequency.setValueAtTime(440, now); // A4
          gain2.gain.setValueAtTime(0.08, now);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc2.start(now);
          osc2.stop(now + 0.16);
          break;

        case 'clear': // Soft descending swoosh
          osc.type = 'sine';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;

        case 'error': // Soft double warning buzz
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;

        case 'toggle': // Quick micro switch
          osc.type = 'sine';
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.03);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
      }
    } catch {
      // AudioContext policy or device audio unsupported - fail silently
    }
  }
}

class NovaApp {
  constructor() {
    this.calc = new NovaCalculator();
    this.sci = new ScientificController(this.calc);
    this.sound = new SoundSynthesizer();
    this.sound.enabled = this.calc.settings.sound;

    // DOM Elements
    this.dom = {
      appRoot: document.documentElement,
      calculatorContainer: document.getElementById('calculator-container'),
      expressionDisplay: document.getElementById('display-expression'),
      resultDisplay: document.getElementById('display-result'),
      previewDisplay: document.getElementById('display-preview'),
      memoryBadge: document.getElementById('memory-badge'),
      angleBadge: document.getElementById('angle-mode-badge'),
      historyDrawer: document.getElementById('history-drawer'),
      historyList: document.getElementById('history-list'),
      historyEmpty: document.getElementById('history-empty'),
      historyCount: document.getElementById('history-count'),
      settingsModal: document.getElementById('settings-modal'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      toastContainer: document.getElementById('toast-container'),
      copyBtn: document.getElementById('btn-copy-result'),
      themeToggleBtn: document.getElementById('btn-theme-toggle'),
      soundToggleBtn: document.getElementById('btn-sound-toggle')
    };

    window.NovaApp = this;
  }

  init() {
    this.applyTheme(this.calc.settings.theme);
    this.updateSoundToggleIcon();
    this.sci.init();
    this.bindKeypadEvents();
    this.bindHeaderEvents();
    this.bindHistoryEvents();
    this.bindSettingsEvents();
    this.bindKeyboardShortcuts();
    this.updateDisplay();
    this.renderHistory();

    // Check system color scheme preference
    if (!localStorage.getItem('novacalc_settings')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.calc.updateSetting('theme', prefersDark ? 'dark' : 'light');
      this.applyTheme(this.calc.settings.theme);
    }
  }

  // --- Theme Management ---
  applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'light' 
        ? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  }

  toggleTheme() {
    const newTheme = this.calc.settings.theme === 'light' ? 'dark' : 'light';
    this.calc.updateSetting('theme', newTheme);
    this.applyTheme(newTheme);
    this.sound.play('toggle');
    this.showToast(`Switched to ${newTheme.toUpperCase()} theme`);
  }

  // --- Sound Management ---
  toggleSound() {
    const newState = !this.calc.settings.sound;
    this.calc.updateSetting('sound', newState);
    this.sound.enabled = newState;
    this.updateSoundToggleIcon();
    if (newState) {
      this.sound.play('click');
    }
    this.showToast(newState ? 'Sound feedback enabled' : 'Sound feedback muted');
  }

  updateSoundToggleIcon() {
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      const isMuted = !this.calc.settings.sound;
      soundBtn.classList.toggle('muted', isMuted);
      soundBtn.innerHTML = isMuted 
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>`;
    }
  }

  // --- Haptic Feedback ---
  triggerHaptic(duration = 12) {
    if (this.calc.settings.haptic && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {
        // unsupported
      }
    }
  }

  // --- Display Update & Dynamic Typography ---
  updateDisplay() {
    const { expression, result, previewResult, hasError, errorMessage } = this.calc;

    // Expression line
    if (this.dom.expressionDisplay) {
      this.dom.expressionDisplay.textContent = expression || '';
      // Keep expression scrolled to the right end
      this.dom.expressionDisplay.scrollLeft = this.dom.expressionDisplay.scrollWidth;
    }

    // Live preview line
    if (this.dom.previewDisplay) {
      if (!this.calc.isEvaluated && previewResult !== null && expression.trim() !== '') {
        const formattedPreview = this.calc.formatNumber(previewResult);
        this.dom.previewDisplay.textContent = `= ${formattedPreview}`;
        this.dom.previewDisplay.style.opacity = '1';
      } else {
        this.dom.previewDisplay.textContent = '';
        this.dom.previewDisplay.style.opacity = '0';
      }
    }

    // Main result line
    if (this.dom.resultDisplay) {
      const textToDisplay = hasError ? errorMessage : result;
      this.dom.resultDisplay.textContent = textToDisplay;

      // Dynamic responsive font-size scaling based on length
      const len = textToDisplay.length;
      if (len > 18) {
        this.dom.resultDisplay.style.fontSize = '1.5rem';
      } else if (len > 14) {
        this.dom.resultDisplay.style.fontSize = '1.85rem';
      } else if (len > 10) {
        this.dom.resultDisplay.style.fontSize = '2.3rem';
      } else {
        this.dom.resultDisplay.style.fontSize = ''; // Default CSS clamp
      }

      this.dom.resultDisplay.classList.toggle('error-state', hasError);
    }

    // Memory Indicator
    if (this.dom.memoryBadge) {
      const hasMem = this.calc.hasActiveMemory();
      this.dom.memoryBadge.classList.toggle('active', hasMem);
      this.dom.memoryBadge.title = hasMem ? `Memory Active: ${this.calc.memory}` : 'Memory Empty';
    }
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info', duration = 2400) {
    if (!this.dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `nova-toast nova-toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
    `;

    this.dom.toastContainer.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // --- Clipboard Integration ---
  copyCurrentResult() {
    const textToCopy = this.calc.result;
    if (!textToCopy || textToCopy === '0' || this.calc.hasError) {
      this.showToast('No valid result to copy', 'error');
      this.sound.play('error');
      return;
    }

    // Clean comma separators for raw copy if user wants clean number
    const cleanNum = textToCopy.replace(/,/g, '');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanNum)
        .then(() => {
          this.showToast(`Copied "${textToCopy}" to clipboard!`, 'success');
          this.sound.play('click');
          this.animateCopyButton();
        })
        .catch(() => {
          this.fallbackCopy(cleanNum, textToCopy);
        });
    } else {
      this.fallbackCopy(cleanNum, textToCopy);
    }
  }

  fallbackCopy(cleanNum, original) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = cleanNum;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast(`Copied "${original}" to clipboard!`, 'success');
      this.sound.play('click');
      this.animateCopyButton();
    } catch {
      this.showToast('Unable to copy to clipboard', 'error');
      this.sound.play('error');
    }
  }

  animateCopyButton() {
    if (this.dom.copyBtn) {
      this.dom.copyBtn.classList.add('copied');
      setTimeout(() => {
        this.dom.copyBtn.classList.remove('copied');
      }, 1500);
    }
  }

  // --- Keypad & Button Actions ---
  bindKeypadEvents() {
    // Event delegation on calculator container
    const keypadContainer = document.getElementById('calculator-keypad');
    if (!keypadContainer) return;

    keypadContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      this.triggerHaptic(10);
      this.handleButtonInteraction(btn);
    });

    // Quick action buttons in display area
    const clearBtn = document.getElementById('btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.calc.clearAll();
        this.sound.play('clear');
        this.triggerHaptic(15);
        this.updateDisplay();
      });
    }

    const backspaceBtn = document.getElementById('btn-backspace');
    if (backspaceBtn) {
      backspaceBtn.addEventListener('click', () => {
        this.calc.deleteLastChar();
        this.sound.play('click');
        this.triggerHaptic(8);
        this.updateDisplay();
      });
    }

    if (this.dom.copyBtn) {
      this.dom.copyBtn.addEventListener('click', () => {
        this.copyCurrentResult();
      });
    }
  }

  handleButtonInteraction(btn) {
    const action = btn.getAttribute('data-action');
    const val = btn.getAttribute('data-value');

    // Visual ripple effect
    this.createRipple(btn);

    // Number or basic operator append
    if (val !== null && val !== undefined) {
      const isOperator = ['+', '−', '×', '÷', '^', '%'].includes(val);
      this.calc.appendInput(val);
      this.sound.play(isOperator ? 'operator' : 'click');
      this.updateDisplay();
      return;
    }

    // Action handling
    switch (action) {
      case 'clear':
        this.calc.clearAll();
        this.sound.play('clear');
        this.updateDisplay();
        break;

      case 'backspace':
        this.calc.deleteLastChar();
        this.sound.play('click');
        this.updateDisplay();
        break;

      case 'toggle-sign':
        this.calc.toggleSign();
        this.sound.play('click');
        this.updateDisplay();
        break;

      case 'calculate':
        const res = this.calc.evaluate();
        if (res && res.success) {
          this.sound.play('equals');
          this.renderHistory();
          // Subtle pulse animation on result
          if (this.dom.resultDisplay) {
            this.dom.resultDisplay.classList.add('result-pulse');
            setTimeout(() => this.dom.resultDisplay.classList.remove('result-pulse'), 350);
          }
        } else {
          this.sound.play('error');
        }
        this.updateDisplay();
        break;

      // Memory Functions
      case 'mc':
        this.calc.memoryClear();
        this.sound.play('click');
        this.showToast('Memory Cleared (MC)');
        this.updateDisplay();
        break;

      case 'mr':
        const recalled = this.calc.memoryRecall();
        this.calc.appendInput(String(recalled));
        this.sound.play('click');
        this.showToast(`Memory Recalled: ${recalled}`);
        this.updateDisplay();
        break;

      case 'm-plus':
        const currentVal = this.calc.result ? parseFloat(this.calc.result.replace(/,/g, '')) : 0;
        this.calc.memoryAdd(currentVal);
        this.sound.play('operator');
        this.showToast(`Added to Memory (M+): ${this.calc.memory}`);
        this.updateDisplay();
        break;

      case 'm-minus':
        const curMinus = this.calc.result ? parseFloat(this.calc.result.replace(/,/g, '')) : 0;
        this.calc.memorySubtract(curMinus);
        this.sound.play('operator');
        this.showToast(`Subtracted from Memory (M-): ${this.calc.memory}`);
        this.updateDisplay();
        break;

      // Scientific Actions
      default:
        if (action) {
          this.sci.handleScientificAction(action);
          this.sound.play('operator');
          this.updateDisplay();
        }
        break;
    }
  }

  createRipple(btn) {
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 450);
  }

  // --- Header & Panel Controls ---
  bindHeaderEvents() {
    const sciToggle = document.getElementById('toggle-scientific-btn');
    if (sciToggle) {
      sciToggle.addEventListener('click', () => {
        const state = this.sci.toggleScientific();
        this.sound.play('toggle');
        this.showToast(state ? 'Scientific Mode Activated' : 'Standard Mode Activated');
      });
    }

    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.addEventListener('click', () => {
        this.toggleSound();
      });
    }

    const historyBtn = document.getElementById('btn-history-toggle');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this.toggleHistoryDrawer();
      });
    }

    const settingsBtn = document.getElementById('btn-settings-toggle');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }
  }

  // --- History Drawer ---
  toggleHistoryDrawer(forceState) {
    const drawer = this.dom.historyDrawer;
    if (!drawer) return;

    const isOpen = typeof forceState === 'boolean' 
      ? forceState 
      : drawer.classList.contains('open');

    if (!isOpen) {
      drawer.classList.add('open');
      document.body.classList.add('drawer-open');
      this.renderHistory();
      this.sound.play('toggle');
    } else {
      drawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
      this.sound.play('toggle');
    }
  }

  bindHistoryEvents() {
    const closeBtn = document.getElementById('btn-close-history');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleHistoryDrawer(false));
    }

    const backdrop = document.getElementById('history-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.toggleHistoryDrawer(false));
    }

    const clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (this.calc.history.length === 0) return;
        if (confirm('Are you sure you want to clear all calculation history?')) {
          this.calc.clearHistory();
          this.renderHistory();
          this.sound.play('clear');
          this.showToast('Calculation history cleared', 'info');
        }
      });
    }

    // History Item Delegated Actions
    if (this.dom.historyList) {
      this.dom.historyList.addEventListener('click', (e) => {
        const itemCard = e.target.closest('.history-item');
        if (!itemCard) return;

        const id = itemCard.getAttribute('data-id');
        const entry = this.calc.history.find(h => h.id === id);
        if (!entry) return;

        const deleteBtn = e.target.closest('.history-delete-btn');
        if (deleteBtn) {
          e.stopPropagation();
          this.calc.deleteHistoryItem(id);
          this.renderHistory();
          this.sound.play('clear');
          this.showToast('History item deleted');
          return;
        }

        const copyBtn = e.target.closest('.history-copy-btn');
        if (copyBtn) {
          e.stopPropagation();
          const cleanNum = entry.result.replace(/,/g, '');
          navigator.clipboard.writeText(cleanNum).then(() => {
            this.showToast(`Copied "${entry.result}" to clipboard!`, 'success');
            this.sound.play('click');
          });
          return;
        }

        // Clicking anywhere on card loads result into calculator
        this.calc.expression = entry.expression;
        this.calc.result = entry.result;
        this.calc.isEvaluated = true;
        this.calc.hasError = false;
        this.updateDisplay();
        this.toggleHistoryDrawer(false);
        this.sound.play('click');
        this.showToast(`Loaded: ${entry.expression} = ${entry.result}`);
      });
    }
  }

  renderHistory() {
    if (!this.dom.historyList) return;

    const list = this.calc.history;
    if (this.dom.historyCount) {
      this.dom.historyCount.textContent = list.length;
    }

    if (list.length === 0) {
      if (this.dom.historyEmpty) this.dom.historyEmpty.style.display = 'flex';
      this.dom.historyList.innerHTML = '';
      return;
    }

    if (this.dom.historyEmpty) this.dom.historyEmpty.style.display = 'none';

    this.dom.historyList.innerHTML = list.map(item => {
      const timeStr = this.formatTimeAgo(item.timestamp);
      return `
        <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Expression: ${item.expression}, Result: ${item.result}">
          <div class="history-item-top">
            <span class="history-time">${timeStr}</span>
            <div class="history-badges">
              <span class="history-badge-mode">${item.angleMode || 'DEG'}</span>
              <button class="history-action-btn history-copy-btn" title="Copy Result" aria-label="Copy Result">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="history-action-btn history-delete-btn" title="Delete Entry" aria-label="Delete Entry">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="history-expr">${this.escapeHTML(item.expression)}</div>
          <div class="history-result">= ${this.escapeHTML(item.result)}</div>
        </div>
      `;
    }).join('');
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Settings Modal ---
  openSettingsModal() {
    if (!this.dom.settingsModal) return;
    this.dom.settingsModal.classList.add('open');
    this.sound.play('toggle');
    this.syncSettingsForm();
  }

  closeSettingsModal() {
    if (!this.dom.settingsModal) return;
    this.dom.settingsModal.classList.remove('open');
    this.sound.play('toggle');
  }

  syncSettingsForm() {
    const s = this.calc.settings;
    const themeSelect = document.getElementById('setting-theme');
    const angleSelect = document.getElementById('setting-angle');
    const precisionSelect = document.getElementById('setting-precision');
    const soundToggle = document.getElementById('setting-sound');
    const separatorToggle = document.getElementById('setting-separator');
    const hapticToggle = document.getElementById('setting-haptic');

    if (themeSelect) themeSelect.value = s.theme;
    if (angleSelect) angleSelect.value = s.angleMode;
    if (precisionSelect) precisionSelect.value = s.precision;
    if (soundToggle) soundToggle.checked = s.sound;
    if (separatorToggle) separatorToggle.checked = s.thousandsSeparator;
    if (hapticToggle) hapticToggle.checked = s.haptic;
  }

  bindSettingsEvents() {
    const closeBtn = document.getElementById('btn-close-settings');
    const backdrop = document.getElementById('settings-backdrop');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeSettingsModal());

    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.calc.updateSetting('theme', e.target.value);
        this.applyTheme(e.target.value);
      });
    }

    const angleSelect = document.getElementById('setting-angle');
    if (angleSelect) {
      angleSelect.addEventListener('change', (e) => {
        this.calc.updateSetting('angleMode', e.target.value);
        this.sci.updateAngleDisplay();
        this.calc.updatePreview();
        this.updateDisplay();
      });
    }

    const precisionSelect = document.getElementById('setting-precision');
    if (precisionSelect) {
      precisionSelect.addEventListener('change', (e) => {
        this.calc.updateSetting('precision', e.target.value);
        this.updateDisplay();
      });
    }

    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.calc.updateSetting('sound', e.target.checked);
        this.sound.enabled = e.target.checked;
        this.updateSoundToggleIcon();
      });
    }

    const separatorToggle = document.getElementById('setting-separator');
    if (separatorToggle) {
      separatorToggle.addEventListener('change', (e) => {
        this.calc.updateSetting('thousandsSeparator', e.target.checked);
        this.updateDisplay();
      });
    }

    const hapticToggle = document.getElementById('setting-haptic');
    if (hapticToggle) {
      hapticToggle.addEventListener('change', (e) => {
        this.calc.updateSetting('haptic', e.target.checked);
      });
    }

    // Reset settings
    const resetBtn = document.getElementById('btn-reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all settings to default values?')) {
          localStorage.removeItem('novacalc_settings');
          this.calc.settings = this.calc.loadSettings();
          this.applyTheme(this.calc.settings.theme);
          this.sound.enabled = this.calc.settings.sound;
          this.updateSoundToggleIcon();
          this.sci.updateAngleDisplay();
          this.syncSettingsForm();
          this.updateDisplay();
          this.showToast('Settings reset to defaults');
        }
      });
    }

    // Keyboard shortcuts modal toggle
    const shortcutsBtn = document.getElementById('btn-shortcuts-info');
    const closeShortcutsBtn = document.getElementById('btn-close-shortcuts');
    const shortcutsBackdrop = document.getElementById('shortcuts-backdrop');

    if (shortcutsBtn) {
      shortcutsBtn.addEventListener('click', () => {
        if (this.dom.shortcutsModal) this.dom.shortcutsModal.classList.add('open');
      });
    }
    if (closeShortcutsBtn) {
      closeShortcutsBtn.addEventListener('click', () => {
        if (this.dom.shortcutsModal) this.dom.shortcutsModal.classList.remove('open');
      });
    }
    if (shortcutsBackdrop) {
      shortcutsBackdrop.addEventListener('click', () => {
        if (this.dom.shortcutsModal) this.dom.shortcutsModal.classList.remove('open');
      });
    }
  }

  // --- Keyboard Support & Key Visual Feedback ---
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't capture when typing inside an input/select/textarea
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      // Close modals on Escape if open
      if (e.key === 'Escape') {
        if (this.dom.settingsModal && this.dom.settingsModal.classList.contains('open')) {
          this.closeSettingsModal();
          return;
        }
        if (this.dom.shortcutsModal && this.dom.shortcutsModal.classList.contains('open')) {
          this.dom.shortcutsModal.classList.remove('open');
          return;
        }
        if (this.dom.historyDrawer && this.dom.historyDrawer.classList.contains('open')) {
          this.toggleHistoryDrawer(false);
          return;
        }
      }

      let handled = false;
      const key = e.key;

      // Digit keys 0-9
      if (/^[0-9]$/.test(key)) {
        this.calc.appendInput(key);
        this.sound.play('click');
        this.triggerHaptic(8);
        this.highlightButton(`[data-value="${key}"]`);
        handled = true;
      }
      // Decimal point
      else if (key === '.' || key === ',') {
        this.calc.appendInput('.');
        this.sound.play('click');
        this.highlightButton('[data-value="."]');
        handled = true;
      }
      // Basic Operators
      else if (key === '+') {
        this.calc.appendInput('+');
        this.sound.play('operator');
        this.highlightButton('[data-value="+"]');
        handled = true;
      }
      else if (key === '-') {
        this.calc.appendInput('−');
        this.sound.play('operator');
        this.highlightButton('[data-value="−"]');
        handled = true;
      }
      else if (key === '*' || key === 'x' || key === 'X') {
        this.calc.appendInput('×');
        this.sound.play('operator');
        this.highlightButton('[data-value="×"]');
        handled = true;
      }
      else if (key === '/') {
        e.preventDefault(); // Prevent browser quick-find
        this.calc.appendInput('÷');
        this.sound.play('operator');
        this.highlightButton('[data-value="÷"]');
        handled = true;
      }
      // Power / Exponent
      else if (key === '^') {
        this.calc.appendInput('^');
        this.sound.play('operator');
        this.highlightButton('[data-action="power"]');
        handled = true;
      }
      // Factorial
      else if (key === '!') {
        this.calc.appendInput('!');
        this.sound.play('operator');
        this.highlightButton('[data-action="factorial"]');
        handled = true;
      }
      // Percentage
      else if (key === '%') {
        this.calc.appendInput('%');
        this.sound.play('operator');
        this.highlightButton('[data-value="%"]');
        handled = true;
      }
      // Parentheses
      else if (key === '(') {
        this.calc.appendInput('(');
        this.sound.play('operator');
        this.highlightButton('[data-value="("]');
        handled = true;
      }
      else if (key === ')') {
        this.calc.appendInput(')');
        this.sound.play('operator');
        this.highlightButton('[data-value=")"]');
        handled = true;
      }
      // Calculate
      else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        const res = this.calc.evaluate();
        if (res && res.success) {
          this.sound.play('equals');
          this.renderHistory();
          if (this.dom.resultDisplay) {
            this.dom.resultDisplay.classList.add('result-pulse');
            setTimeout(() => this.dom.resultDisplay.classList.remove('result-pulse'), 350);
          }
        } else {
          this.sound.play('error');
        }
        this.highlightButton('[data-action="calculate"]');
        handled = true;
      }
      // Backspace / Delete
      else if (key === 'Backspace') {
        this.calc.deleteLastChar();
        this.sound.play('click');
        this.highlightButton('#btn-backspace');
        handled = true;
      }
      // Escape for Clear All (AC)
      else if (key === 'Escape') {
        this.calc.clearAll();
        this.sound.play('clear');
        this.highlightButton('#btn-clear');
        handled = true;
      }
      // Scientific hotkeys (when not in standard input)
      else if (e.altKey || (!e.ctrlKey && !e.metaKey)) {
        switch (key.toLowerCase()) {
          case 's':
            this.calc.appendInput('sin(');
            this.sound.play('operator');
            this.highlightButton('[data-action="sin"]');
            handled = true;
            break;
          case 'c':
            if (!e.ctrlKey && !e.metaKey) {
              this.calc.appendInput('cos(');
              this.sound.play('operator');
              this.highlightButton('[data-action="cos"]');
              handled = true;
            }
            break;
          case 't':
            this.calc.appendInput('tan(');
            this.sound.play('operator');
            this.highlightButton('[data-action="tan"]');
            handled = true;
            break;
          case 'l':
            this.calc.appendInput('log(');
            this.sound.play('operator');
            this.highlightButton('[data-action="log"]');
            handled = true;
            break;
          case 'n':
            this.calc.appendInput('ln(');
            this.sound.play('operator');
            this.highlightButton('[data-action="ln"]');
            handled = true;
            break;
          case 'p':
            this.calc.appendInput('π');
            this.sound.play('operator');
            this.highlightButton('[data-action="pi"]');
            handled = true;
            break;
          case 'e':
            this.calc.appendInput('e');
            this.sound.play('operator');
            this.highlightButton('[data-action="e"]');
            handled = true;
            break;
          case 'r':
            this.calc.appendInput('sqrt(');
            this.sound.play('operator');
            this.highlightButton('[data-action="sqrt"]');
            handled = true;
            break;
        }
      }

      if (handled) {
        this.updateDisplay();
      }
    });
  }

  highlightButton(selector) {
    try {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.classList.add('keyboard-active');
        setTimeout(() => btn.classList.remove('keyboard-active'), 180);
      }
    } catch {
      // Invalid selector fallback
    }
  }
}

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const app = new NovaApp();
  app.init();
});
