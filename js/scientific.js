/**
 * NOVA CALC - Scientific Calculator Module
 * 
 * Manages advanced scientific operations, trigonometric transformations,
 * angle unit conversions (Degrees / Radians), and the secondary (2nd/Inv) mode.
 */

class ScientificController {
  constructor(calculator) {
    this.calc = calculator;
    this.isInverse = false;
    this.isScientificActive = false;
  }

  init() {
    this.bindEvents();
    this.updateAngleDisplay();
  }

  toggleScientific(forceState) {
    this.isScientificActive = typeof forceState === 'boolean' ? forceState : !this.isScientificActive;
    const container = document.getElementById('calculator-container');
    const toggleBtn = document.getElementById('toggle-scientific-btn');
    const sciGrid = document.getElementById('scientific-keypad');

    if (container) {
      container.classList.toggle('scientific-mode', this.isScientificActive);
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.isScientificActive);
      toggleBtn.setAttribute('aria-expanded', String(this.isScientificActive));
    }
    if (sciGrid) {
      sciGrid.setAttribute('aria-hidden', String(!this.isScientificActive));
    }

    return this.isScientificActive;
  }

  toggleInverse() {
    this.isInverse = !this.isInverse;
    const invBtn = document.getElementById('btn-inv');
    if (invBtn) {
      invBtn.classList.toggle('active', this.isInverse);
    }

    // Toggle button labels and data actions for inverse functions
    document.querySelectorAll('[data-inv]').forEach(btn => {
      const primaryText = btn.getAttribute('data-primary');
      const invText = btn.getAttribute('data-inv');
      const primaryAction = btn.getAttribute('data-primary-action');
      const invAction = btn.getAttribute('data-inv-action');

      if (this.isInverse) {
        btn.innerHTML = invText;
        if (invAction) btn.setAttribute('data-action', invAction);
      } else {
        btn.innerHTML = primaryText;
        if (primaryAction) btn.setAttribute('data-action', primaryAction);
      }
    });

    return this.isInverse;
  }

  toggleAngleMode() {
    const current = this.calc.engine.getAngleMode();
    const next = current === 'DEG' ? 'RAD' : 'DEG';
    this.calc.updateSetting('angleMode', next);
    this.updateAngleDisplay();
    // Update live preview with new angle unit
    this.calc.updatePreview();
    return next;
  }

  updateAngleDisplay() {
    const currentMode = this.calc.engine.getAngleMode();
    const badge = document.getElementById('angle-mode-badge');
    const btn = document.getElementById('btn-angle-toggle');
    if (badge) {
      badge.textContent = currentMode;
    }
    if (btn) {
      btn.textContent = currentMode;
      btn.classList.toggle('rad-active', currentMode === 'RAD');
    }
  }

  /**
   * Dispatches scientific operations
   */
  handleScientificAction(action) {
    switch (action) {
      case 'square':
        this.calc.appendInput('^2');
        break;
      case 'cube':
        this.calc.appendInput('^3');
        break;
      case 'power':
        this.calc.appendInput('^');
        break;
      case 'sqrt':
        this.calc.appendInput('sqrt(');
        break;
      case 'cbrt':
        this.calc.appendInput('cbrt(');
        break;
      case 'reciprocal':
        this.handleReciprocal();
        break;
      case 'sin':
        this.calc.appendInput(this.isInverse ? 'asin(' : 'sin(');
        break;
      case 'cos':
        this.calc.appendInput(this.isInverse ? 'acos(' : 'cos(');
        break;
      case 'tan':
        this.calc.appendInput(this.isInverse ? 'atan(' : 'tan(');
        break;
      case 'asin':
        this.calc.appendInput('asin(');
        break;
      case 'acos':
        this.calc.appendInput('acos(');
        break;
      case 'atan':
        this.calc.appendInput('atan(');
        break;
      case 'sinh':
        this.calc.appendInput('sinh(');
        break;
      case 'cosh':
        this.calc.appendInput('cosh(');
        break;
      case 'tanh':
        this.calc.appendInput('tanh(');
        break;
      case 'log':
        if (this.isInverse) {
          this.calc.appendInput('10^');
        } else {
          this.calc.appendInput('log(');
        }
        break;
      case 'ln':
        if (this.isInverse) {
          this.calc.appendInput('e^');
        } else {
          this.calc.appendInput('ln(');
        }
        break;
      case 'ten-power':
        this.calc.appendInput('10^(');
        break;
      case 'e-power':
        this.calc.appendInput('e^(');
        break;
      case 'factorial':
        this.calc.appendInput('!');
        break;
      case 'pi':
        this.calc.appendInput('π');
        break;
      case 'e':
        this.calc.appendInput('e');
        break;
      case 'abs':
        this.calc.appendInput('abs(');
        break;
      case 'exp':
        this.calc.appendInput(' * 10^(');
        break;
      default:
        console.warn(`Unknown scientific action: ${action}`);
    }
  }

  handleReciprocal() {
    if (this.calc.isEvaluated && this.calc.result) {
      const val = parseFloat(this.calc.result);
      if (val === 0) {
        this.calc.hasError = true;
        this.calc.errorMessage = 'Cannot divide by 0';
        this.calc.result = 'Cannot divide by 0';
        return;
      }
      this.calc.expression = `1 / (${this.calc.result})`;
      this.calc.evaluate();
    } else if (this.calc.expression) {
      this.calc.expression = `1 / (${this.calc.expression})`;
      this.calc.updatePreview();
    } else {
      this.calc.expression = '1 / (';
    }
  }

  bindEvents() {
    const angleToggleBtn = document.getElementById('btn-angle-toggle');
    if (angleToggleBtn) {
      angleToggleBtn.addEventListener('click', () => {
        const mode = this.toggleAngleMode();
        if (window.NovaApp && window.NovaApp.showToast) {
          window.NovaApp.showToast(`Angle unit: ${mode === 'DEG' ? 'Degrees (°)' : 'Radians (rad)'}`);
        }
      });
    }

    const invBtn = document.getElementById('btn-inv');
    if (invBtn) {
      invBtn.addEventListener('click', () => {
        this.toggleInverse();
      });
    }
  }
}

// Export for module or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScientificController };
} else {
  window.ScientificController = ScientificController;
}
