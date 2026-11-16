/**
 * NOVA CALC - Core Mathematical Engine & Parser
 * 
 * Features:
 * - Safe mathematical expression tokenizer and Shunting-Yard (RPN) evaluator
 * - Zero use of eval() or Function() constructor (100% secure mathematical engine)
 * - Supports arbitrary operator precedence (BODMAS/PEMDAS), unary operators, parentheses
 * - Handles advanced mathematical functions, constants (π, e), and trigonometry
 * - Configurable Angle Mode (Degrees vs Radians)
 * - High-precision floating-point arithmetic with precision compensation
 * - Memory registers (MC, MR, M+, M-)
 * - Calculation history management with localStorage persistence
 */

class MathEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.precision = 12; // Internal floating-point precision
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  getAngleMode() {
    return this.angleMode;
  }

  /**
   * Pre-processes expression string to normalize symbols and implicit multiplication
   */
  normalize(expression) {
    if (!expression || typeof expression !== 'string') return '';

    let expr = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/π/g, 'pi')
      .replace(/√\(/g, 'sqrt(')
      .replace(/√(\d+(\.\d+)?)/g, 'sqrt($1)')
      .replace(/\s+/g, '');

    // Insert implicit multiplication: e.g., 2(3) -> 2*(3), (2)(3) -> (2)*(3), 2pi -> 2*pi, 2sqrt -> 2*sqrt
    expr = expr.replace(/(\d)(\()/g, '$1*$2');
    expr = expr.replace(/(\))(\d)/g, '$1*$2');
    expr = expr.replace(/(\))(\()/g, '$1*$2');
    expr = expr.replace(/(\d)(pi|e|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|sqrt|cbrt|abs)/g, '$1*$2');
    expr = expr.replace(/(\))(pi|e|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|sqrt|cbrt|abs)/g, '$1*$2');
    expr = expr.replace(/(pi|e)(\d)/g, '$1*$2');
    expr = expr.replace(/(pi|e)(\()/g, '$1*$2');

    return expr;
  }

  /**
   * Tokenizes normalized mathematical string into structured tokens
   */
  tokenize(expression) {
    const expr = this.normalize(expression);
    const tokens = [];
    let i = 0;

    const isDigit = (ch) => /\d/.test(ch);
    const isAlpha = (ch) => /[a-zA-Z]/.test(ch);

    while (i < expr.length) {
      const ch = expr[i];

      // Number token (including decimals)
      if (isDigit(ch) || (ch === '.' && isDigit(expr[i + 1]))) {
        let numStr = '';
        let dotCount = 0;
        while (i < expr.length && (isDigit(expr[i]) || expr[i] === '.')) {
          if (expr[i] === '.') {
            dotCount++;
            if (dotCount > 1) {
              throw new Error('Multiple decimal points in number');
            }
          }
          numStr += expr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Identifier / Function / Constant
      if (isAlpha(ch)) {
        let name = '';
        while (i < expr.length && isAlpha(expr[i])) {
          name += expr[i];
          i++;
        }
        name = name.toLowerCase();

        if (name === 'pi') {
          tokens.push({ type: 'NUMBER', value: Math.PI });
        } else if (name === 'e') {
          tokens.push({ type: 'NUMBER', value: Math.E });
        } else if ([
          'sin', 'cos', 'tan',
          'asin', 'acos', 'atan',
          'sinh', 'cosh', 'tanh',
          'log', 'ln', 'sqrt', 'cbrt', 'abs', 'fact'
        ].includes(name)) {
          tokens.push({ type: 'FUNCTION', value: name });
        } else {
          throw new Error(`Unknown identifier: ${name}`);
        }
        continue;
      }

      // Unary or Binary Minus / Plus
      if (ch === '-' || ch === '+') {
        const prev = tokens[tokens.length - 1];
        const isUnary = !prev || prev.type === 'OPERATOR' || prev.type === 'LEFT_PAREN' || prev.type === 'FUNCTION';
        
        if (isUnary) {
          if (ch === '-') {
            tokens.push({ type: 'UNARY_OP', value: 'u-' });
          } else {
            // Unary plus is a no-op, ignore
          }
        } else {
          tokens.push({ type: 'OPERATOR', value: ch });
        }
        i++;
        continue;
      }

      // Binary operators
      if (['*', '/', '^'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch });
        i++;
        continue;
      }

      // Postfix operators: Factorial (!) and Percent (%)
      if (ch === '!') {
        tokens.push({ type: 'POSTFIX_OP', value: '!' });
        i++;
        continue;
      }

      if (ch === '%') {
        tokens.push({ type: 'POSTFIX_OP', value: '%' });
        i++;
        continue;
      }

      // Parentheses
      if (ch === '(') {
        tokens.push({ type: 'LEFT_PAREN', value: '(' });
        i++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'RIGHT_PAREN', value: ')' });
        i++;
        continue;
      }

      throw new Error(`Invalid character: ${ch}`);
    }

    return tokens;
  }

  /**
   * Shunting-Yard Algorithm: converts Infix tokens to Reverse Polish Notation (RPN)
   */
  toRPN(tokens) {
    const outputQueue = [];
    const opStack = [];

    const precedence = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      '^': 4,
      'u-': 5,
      '%': 6,
      '!': 6
    };

    const associativity = {
      '+': 'L',
      '-': 'L',
      '*': 'L',
      '/': 'L',
      '^': 'R',
      'u-': 'R'
    };

    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];

      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'FUNCTION') {
        opStack.push(token);
      } else if (token.type === 'POSTFIX_OP') {
        outputQueue.push(token);
      } else if (token.type === 'UNARY_OP') {
        opStack.push(token);
      } else if (token.type === 'OPERATOR') {
        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (top.type === 'LEFT_PAREN') break;

          const p1 = precedence[token.value] || 0;
          const p2 = precedence[top.value] || 0;
          const assoc = associativity[token.value] || 'L';

          if ((assoc === 'L' && p1 <= p2) || (assoc === 'R' && p1 < p2)) {
            outputQueue.push(opStack.pop());
          } else {
            break;
          }
        }
        opStack.push(token);
      } else if (token.type === 'LEFT_PAREN') {
        opStack.push(token);
      } else if (token.type === 'RIGHT_PAREN') {
        let foundLeft = false;
        while (opStack.length > 0) {
          const top = opStack.pop();
          if (top.type === 'LEFT_PAREN') {
            foundLeft = true;
            break;
          }
          outputQueue.push(top);
        }
        if (!foundLeft) {
          throw new Error('Mismatched parentheses: missing "("');
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
          outputQueue.push(opStack.pop());
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === 'LEFT_PAREN' || top.type === 'RIGHT_PAREN') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  /**
   * Evaluates the Reverse Polish Notation token stream
   */
  evaluateRPN(rpnQueue) {
    const stack = [];

    for (let i = 0; i < rpnQueue.length; i++) {
      const token = rpnQueue[i];

      if (token.type === 'NUMBER') {
        stack.push(token.value);
      } else if (token.type === 'UNARY_OP') {
        if (stack.length < 1) throw new Error('Invalid syntax for unary operator');
        const val = stack.pop();
        if (token.value === 'u-') {
          stack.push(-val);
        }
      } else if (token.type === 'POSTFIX_OP') {
        if (stack.length < 1) throw new Error('Invalid syntax for postfix operator');
        const val = stack.pop();
        if (token.value === '!') {
          if (val < 0 || !Number.isInteger(val)) {
            throw new Error('Factorial is only defined for non-negative integers');
          }
          if (val > 170) {
            throw new Error('Overflow: Factorial too large');
          }
          let fact = 1;
          for (let k = 2; k <= val; k++) fact *= k;
          stack.push(fact);
        } else if (token.value === '%') {
          stack.push(val / 100);
        }
      } else if (token.type === 'OPERATOR') {
        if (stack.length < 2) throw new Error('Incomplete mathematical expression');
        const b = stack.pop();
        const a = stack.pop();

        switch (token.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            if (b === 0) {
              throw new Error('Cannot divide by zero');
            }
            stack.push(a / b);
            break;
          case '^':
            const powRes = Math.pow(a, b);
            if (isNaN(powRes)) throw new Error('Invalid power calculation');
            stack.push(powRes);
            break;
          default:
            throw new Error(`Unsupported operator: ${token.value}`);
        }
      } else if (token.type === 'FUNCTION') {
        if (stack.length < 1) throw new Error(`Missing argument for function ${token.value}`);
        const arg = stack.pop();
        const res = this.applyFunction(token.value, arg);
        stack.push(res);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid mathematical expression syntax');
    }

    const finalVal = stack[0];
    if (isNaN(finalVal)) throw new Error('Result is not a number');
    if (!isFinite(finalVal)) throw new Error('Overflow: Value exceeds limit');

    return this.sanitizePrecision(finalVal);
  }

  /**
   * Applies trigonometric or scientific functions respecting angle mode
   */
  applyFunction(fnName, arg) {
    const isDeg = this.angleMode === 'DEG';
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    switch (fnName) {
      case 'sin': {
        const rad = isDeg ? toRad(arg) : arg;
        // Fix sin(180 deg) = 0 rounding error
        if (isDeg && arg % 180 === 0) return 0;
        return Math.sin(rad);
      }
      case 'cos': {
        const rad = isDeg ? toRad(arg) : arg;
        // Fix cos(90 deg) = 0 rounding error
        if (isDeg && (arg - 90) % 180 === 0) return 0;
        return Math.cos(rad);
      }
      case 'tan': {
        if (isDeg && (arg - 90) % 180 === 0) {
          throw new Error('Tangent is undefined at 90° + k·180°');
        }
        const rad = isDeg ? toRad(arg) : arg;
        if (isDeg && arg % 180 === 0) return 0;
        return Math.tan(rad);
      }
      case 'asin': {
        if (arg < -1 || arg > 1) throw new Error('asin argument must be in [-1, 1]');
        const rad = Math.asin(arg);
        return isDeg ? toDeg(rad) : rad;
      }
      case 'acos': {
        if (arg < -1 || arg > 1) throw new Error('acos argument must be in [-1, 1]');
        const rad = Math.acos(arg);
        return isDeg ? toDeg(rad) : rad;
      }
      case 'atan': {
        const rad = Math.atan(arg);
        return isDeg ? toDeg(rad) : rad;
      }
      case 'sinh':
        return Math.sinh(arg);
      case 'cosh':
        return Math.cosh(arg);
      case 'tanh':
        return Math.tanh(arg);
      case 'log':
        if (arg <= 0) throw new Error('Logarithm requires positive argument');
        return Math.log10(arg);
      case 'ln':
        if (arg <= 0) throw new Error('Natural log requires positive argument');
        return Math.log(arg);
      case 'sqrt':
        if (arg < 0) throw new Error('Cannot compute square root of negative number');
        return Math.sqrt(arg);
      case 'cbrt':
        return Math.cbrt(arg);
      case 'abs':
        return Math.abs(arg);
      case 'fact':
        if (arg < 0 || !Number.isInteger(arg)) throw new Error('Factorial requires non-negative integer');
        if (arg > 170) throw new Error('Overflow: Factorial too large');
        let f = 1;
        for (let k = 2; k <= arg; k++) f *= k;
        return f;
      default:
        throw new Error(`Unsupported function: ${fnName}`);
    }
  }

  /**
   * Fixes JavaScript floating point anomalies (e.g., 0.1 + 0.2 = 0.30000000000000004)
   */
  sanitizePrecision(num) {
    if (Math.abs(num) < 1e-13 && Math.abs(num) > 0) return 0;
    // Format to 12 decimal places to remove floating noise
    const fixed = parseFloat(num.toFixed(12));
    // If it's an integer or near-integer
    if (Math.abs(Math.round(fixed) - fixed) < 1e-11) {
      return Math.round(fixed);
    }
    return fixed;
  }

  /**
   * Main evaluate method: parses expression safely
   */
  calculate(expression) {
    if (!expression || expression.trim() === '') {
      throw new Error('Empty expression');
    }

    const tokens = this.tokenize(expression);
    if (tokens.length === 0) {
      throw new Error('Empty expression');
    }

    const rpn = this.toRPN(tokens);
    return this.evaluateRPN(rpn);
  }

  /**
   * Safe preview evaluator: attempts to calculate or cleans trailing operators
   * Returns calculated preview number or null if incomplete
   */
  calculatePreview(expression) {
    if (!expression || expression.trim() === '') return null;

    let expr = expression.trim();
    // Trim trailing operators, commas, unclosed brackets for live preview attempt
    expr = expr.replace(/[+\-*/×÷^]+$/, '');
    
    // Balance open parentheses for live preview
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      expr += ')'.repeat(openParens - closeParens);
    }

    try {
      const res = this.calculate(expr);
      return res;
    } catch {
      return null;
    }
  }
}

/**
 * NOVA CALC - Calculator State and History Manager
 */
class NovaCalculator {
  constructor() {
    this.engine = new MathEngine();
    this.expression = '';
    this.result = '0';
    this.previewResult = null;
    this.isEvaluated = false;
    this.hasError = false;
    this.errorMessage = '';

    // Memory register
    this.memory = 0;

    // History list loaded from localStorage
    this.history = this.loadHistory();

    // User settings
    this.settings = this.loadSettings();
    this.engine.setAngleMode(this.settings.angleMode || 'DEG');
  }

  // --- Settings Management ---
  loadSettings() {
    const defaultSettings = {
      theme: 'dark',
      sound: true,
      angleMode: 'DEG',
      precision: 'auto', // 'auto', '2', '4', '6', '8'
      thousandsSeparator: true,
      haptic: true
    };
    try {
      const saved = localStorage.getItem('novacalc_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('novacalc_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Unable to save settings to localStorage', e);
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    if (key === 'angleMode') {
      this.engine.setAngleMode(value);
    }
    this.saveSettings();
  }

  // --- History Management ---
  loadHistory() {
    try {
      const saved = localStorage.getItem('novacalc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('novacalc_history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('Unable to save history to localStorage', e);
    }
  }

  addHistory(expression, result) {
    const entry = {
      id: 'nc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      expression,
      result: String(result),
      angleMode: this.engine.getAngleMode(),
      timestamp: Date.now()
    };
    this.history.unshift(entry); // Prepend so most recent is first
    if (this.history.length > 100) {
      this.history.pop();
    }
    this.saveHistory();
    return entry;
  }

  deleteHistoryItem(id) {
    this.history = this.history.filter(item => item.id !== id);
    this.saveHistory();
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  // --- Memory Operations ---
  memoryClear() {
    this.memory = 0;
    return this.memory;
  }

  memoryRecall() {
    return this.memory;
  }

  memoryAdd(value) {
    const num = typeof value === 'number' ? value : parseFloat(value || this.result || 0);
    if (!isNaN(num) && isFinite(num)) {
      this.memory += num;
    }
    return this.memory;
  }

  memorySubtract(value) {
    const num = typeof value === 'number' ? value : parseFloat(value || this.result || 0);
    if (!isNaN(num) && isFinite(num)) {
      this.memory -= num;
    }
    return this.memory;
  }

  hasActiveMemory() {
    return this.memory !== 0;
  }

  // --- Display & Input State Operations ---

  clearAll() {
    this.expression = '';
    this.result = '0';
    this.previewResult = null;
    this.isEvaluated = false;
    this.hasError = false;
    this.errorMessage = '';
  }

  deleteLastChar() {
    if (this.hasError) {
      this.clearAll();
      return;
    }

    if (this.isEvaluated) {
      // If we just evaluated, backspace clears
      this.clearAll();
      return;
    }

    if (!this.expression || this.expression.length === 0) {
      this.result = '0';
      return;
    }

    // Check if ends with multi-char function name like "sin(", "cos(", "log(", "sqrt("
    const fnMatch = this.expression.match(/(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|sqrt|cbrt|abs)\($/);
    if (fnMatch) {
      this.expression = this.expression.substring(0, this.expression.length - fnMatch[0].length);
    } else {
      this.expression = this.expression.slice(0, -1);
    }

    if (this.expression.length === 0) {
      this.result = '0';
      this.previewResult = null;
    } else {
      this.updatePreview();
    }
  }

  appendInput(str) {
    if (this.hasError) {
      this.clearAll();
    }

    // If an evaluation just completed
    if (this.isEvaluated) {
      // If user inputs an operator, continue calculating with previous result
      if (['+', '−', '-', '×', '*', '÷', '/', '^', '%'].includes(str)) {
        this.expression = this.result + ' ' + str + ' ';
        this.isEvaluated = false;
      } else {
        // User typed a new number or function: start fresh
        this.expression = '';
        this.isEvaluated = false;
      }
    }

    // Prevent duplicate adjacent operators
    const isOp = (val) => ['+', '−', '-', '×', '*', '÷', '/', '^'].includes(val.trim());
    if (isOp(str)) {
      const trimmed = this.expression.trim();
      if (trimmed.length > 0) {
        const lastChar = trimmed.slice(-1);
        if (isOp(lastChar)) {
          // Replace last operator with the new one
          this.expression = trimmed.slice(0, -1).trim() + ' ' + str + ' ';
          this.updatePreview();
          return;
        }
      } else if (str === '−' || str === '-') {
        // Leading minus allowed
        this.expression = '-';
        return;
      } else {
        // Can't start with binary operator other than minus
        return;
      }
      this.expression += ' ' + str + ' ';
    } else if (str === '.') {
      // Validate multiple decimals in the current operand
      const tokens = this.expression.split(/[\s+\-−×*÷/^()]+/);
      const currentToken = tokens[tokens.length - 1];
      if (currentToken.includes('.')) {
        return; // Reject second decimal point
      }
      if (currentToken === '') {
        this.expression += '0.';
      } else {
        this.expression += '.';
      }
    } else {
      this.expression += str;
    }

    this.updatePreview();
  }

  toggleSign() {
    if (this.hasError) return;

    if (this.isEvaluated) {
      const val = parseFloat(this.result);
      if (!isNaN(val)) {
        this.result = String(-val);
        this.expression = this.result;
      }
      return;
    }

    if (!this.expression) {
      this.expression = '-';
      return;
    }

    // Toggle sign of current last number token
    const match = this.expression.match(/(-?\d+(\.\d+)?)$/);
    if (match) {
      const numStr = match[0];
      const startIdx = match.index;
      if (numStr.startsWith('-')) {
        this.expression = this.expression.substring(0, startIdx) + numStr.substring(1);
      } else {
        this.expression = this.expression.substring(0, startIdx) + '-' + numStr;
      }
      this.updatePreview();
    } else if (this.expression.endsWith('-')) {
      this.expression = this.expression.slice(0, -1);
    } else {
      this.expression += '(-';
    }
  }

  updatePreview() {
    if (!this.expression || this.expression.trim() === '') {
      this.previewResult = null;
      return;
    }

    const preview = this.engine.calculatePreview(this.expression);
    if (preview !== null && !isNaN(preview) && isFinite(preview)) {
      this.previewResult = preview;
    } else {
      this.previewResult = null;
    }
  }

  evaluate() {
    if (this.hasError) {
      this.clearAll();
      return;
    }

    if (!this.expression || this.expression.trim() === '') {
      return;
    }

    try {
      const calculatedVal = this.engine.calculate(this.expression);
      const formattedResult = this.formatNumber(calculatedVal);
      
      // Save to history
      this.addHistory(this.expression, formattedResult);

      this.result = formattedResult;
      this.isEvaluated = true;
      this.previewResult = null;
      this.hasError = false;
      this.errorMessage = '';
      return { success: true, result: formattedResult, expression: this.expression };
    } catch (err) {
      this.hasError = true;
      this.errorMessage = err.message || 'Syntax Error';
      this.result = this.errorMessage;
      this.previewResult = null;
      return { success: false, error: this.errorMessage };
    }
  }

  formatNumber(val, options = {}) {
    if (typeof val !== 'number') {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return String(val);
      val = parsed;
    }

    if (!isFinite(val)) return 'Overflow';

    const precisionSetting = options.precision || this.settings.precision;
    const useSeparator = options.thousandsSeparator !== undefined ? options.thousandsSeparator : this.settings.thousandsSeparator;

    let strVal;
    if (precisionSetting && precisionSetting !== 'auto') {
      const digits = parseInt(precisionSetting, 10);
      strVal = val.toFixed(digits);
    } else {
      // Auto precision up to 10 significant digits
      if (Math.abs(val) > 1e15 || (Math.abs(val) < 1e-6 && val !== 0)) {
        strVal = val.toExponential(6);
      } else {
        strVal = String(parseFloat(val.toFixed(10)));
      }
    }

    if (useSeparator && !strVal.includes('e')) {
      const parts = strVal.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }

    return strVal;
  }
}

// Export for module or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MathEngine, NovaCalculator };
} else {
  window.MathEngine = MathEngine;
  window.NovaCalculator = NovaCalculator;
}
