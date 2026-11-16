# NOVA CALC — Premium Advanced Scientific Calculator

> *"Calculate Beyond Limits."*  
> Developed for the **Code Alpha Internship Program** (Frontend Development / UI/UX Track).

[![Status](https://img.shields.io/badge/Status-Complete-success?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-HTML5%20•%20CSS3%20•%20Vanilla%20JS-8b5cf6?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#)

---

## 🌟 Overview

**NOVA CALC** is a commercial-grade, high-performance web calculator engineered with modern design principles and mathematical rigor. Moving beyond basic calculator demonstrations, NOVA CALC integrates a safe mathematical parsing engine (completely free of insecure `eval()` or dynamic code evaluation), real-time live preview calculation, slide-out history persistence, rich scientific functions, Web Audio API sound synthesis, responsive typography, and an ultra-refined dark/light glassmorphic interface.

---

## 🎨 Design & Aesthetic Highlights

- **Aesthetic Direction:** Modern Glassmorphism with deep black & charcoal base layers (`#090a12`, `#121422`), frosted backdrops (`backdrop-filter: blur(28px)`), specular micro-borders, and electric violet / neon highlights.
- **Ambient Illumination:** Animated radial ambient glow orbs that respond subtly to theme transitions.
- **Micro-Interactions & Haptics:**
  - Tactile Web Audio key-click synthesis with distinct harmonic frequencies for numbers, operators, clear actions, and evaluation completion.
  - Native touch haptic vibration support for mobile devices.
  - Smooth scale and ripple feedback on button press.
  - Dynamic result pulse animations upon evaluation.
- **Responsive Fluid Typography:** Display digits dynamically scale down as expression and result lengths grow, guaranteeing zero layout clipping or horizontal distortion.
- **Theme Dual-Mode:** One-click transition between **Deep Neon Dark** and **Frosted Porcelain Light** modes with persisted user preference.

---

## 🚀 Key Features

### 1. 🛡️ Secure Mathematical Engine (No `eval()`)
- **Zero Insecure Code Execution:** Evaluates expressions through a custom Tokenizer, Infix-to-RPN Shunting-Yard parser, and Stack-based Evaluator.
- **Strict Operator Precedence:** Respects standard mathematical order of operations (BODMAS/PEMDAS) with parentheses, exponents, unary negation, postfix factorials, and percentages.
- **Floating-Point Precision Compensation:** Corrects classic IEEE-754 precision anomalies (e.g., $0.1 + 0.2 = 0.3$, $\sin(180^\circ) = 0$).
- **Graceful Error Handling:** Provides user-friendly warnings for mathematical domain errors (e.g., division by zero, $\sqrt{-x}$, $\log(0)$) without application crashes.

### 2. ⚡ Real-Time Calculation Preview
- Live computation stream dynamically reflects the result of valid sub-expressions *before* pressing the equals button.
- Seamless chaining allows subsequent operator clicks to directly continue computation from previous results.

### 3. 🔬 Advanced Scientific Mode
- **Trigonometric Functions:** $\sin$, $\cos$, $\tan$ and their inverse counterparts ($\sin^{-1}$, $\cos^{-1}$, $\tan^{-1}$) via the `2nd / Inv` function toggle.
- **Hyperbolic & Logarithmic Functions:** $\sinh$, $\cosh$, $\tanh$, $\log_{10}$, $\ln$, and exponents ($10^x$, $e^x$).
- **Powers & Roots:** $x^2$, $x^3$, $x^y$, $\sqrt{x}$, $\sqrt[3]{x}$, reciprocal ($1/x$).
- **Constants & Operators:** $\pi$ ($3.14159...$), $e$ ($2.71828...$), Factorials ($n!$), Absolute value ($|x|$).
- **Angle Unit Switching:** One-click toggling between **Degrees (DEG)** and **Radians (RAD)** with persistent state.

### 4. 📜 Calculation History Panel
- Slide-out glass drawer preserving past equations and answers.
- Displayed with relative timestamps and angle mode badges.
- Click any past calculation card to restore it into the calculator.
- Dedicated copy buttons and individual deletion controls.
- Full local persistence via browser `localStorage`.

### 5. 💾 Memory Functions
- Standard commercial memory registers:
  - **MC:** Memory Clear
  - **MR:** Memory Recall
  - **M+:** Memory Add
  - **M−:** Memory Subtract
- Visual "M" badge illuminates in the screen status bar whenever memory holds a non-zero value.

### 6. ⌨️ Comprehensive Keyboard Accessibility
- `0`–`9`: Direct numeric entry
- `+`, `-`, `*`, `/`: Arithmetic operators
- `Enter` or `=`: Calculate result
- `Backspace`: Delete previous character (with intelligent multi-character function deletion)
- `Escape`: Clear all (AC)
- `(` and `)`: Parentheses grouping
- `%`: Percentage
- `^`: Exponent
- `!` : Factorial
- `s`, `c`, `t`: $\sin$, $\cos$, $\tan$
- `l`, `n`: $\log$, $\ln$
- `p`, `e`: $\pi$, $e$
- `r`: Square root ($\sqrt{x}$)
- Physical key presses visually illuminate corresponding on-screen buttons in real-time.

---

## 📂 Project Architecture

```
nova-calc/
├── index.html            # Semantic HTML5 shell with accessibility attributes & SVG icons
├── css/
│   └── style.css         # Complete design system, glassmorphism, responsive queries
├── js/
│   ├── calculator.js     # Tokenizer, Shunting-Yard parser, evaluator, memory, history
│   ├── scientific.js     # Scientific mode controller, angle mode, inverse functions
│   └── app.js            # App orchestrator, Web Audio synth, events, keyboard navigation
├── assets/
│   └── icons/            # SVG vector assets (logo, favicon, scientific, history, settings)
└── README.md             # Documentation and internship submission guide
```

---

## 💻 Quick Start & Running Locally

NOVA CALC uses native web technologies without requiring third-party build tools, bundlers, or heavy dependencies.

### Option A: Open directly in your browser
Simply double-click or open `nova-calc/index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Option B: Local Development Server
Using Python (if installed):
```bash
cd nova-calc
python -m http.server 3000
```
Then navigate to: `http://localhost:3000`

Using Node.js / npx:
```bash
cd nova-calc
npx serve .
```

---

## 🧪 Mathematical Test Cases Verified

| Expression | Expected Result | Engine Output | Status |
| :--- | :--- | :--- | :--- |
| `25 + 15` | `40` | `40` | ✅ Verified |
| `100 − 35` | `65` | `65` | ✅ Verified |
| `12 × 8` | `96` | `96` | ✅ Verified |
| `144 ÷ 12` | `12` | `12` | ✅ Verified |
| `10 / 4` | `2.5` | `2.5` | ✅ Verified |
| `0.1 + 0.2` | `0.3` | `0.3` | ✅ Precision Fixed |
| `10 / 0` | Friendly Error | `"Cannot divide by zero"` | ✅ Safe Trap |
| `sin(90)` in DEG | `1` | `1` | ✅ Verified |
| `sin(180)` in DEG | `0` | `0` | ✅ Rounded Exactly |
| `5!` | `120` | `120` | ✅ Verified |
| `2 ^ 3 ^ 2` | `512` | `512` | ✅ Right-Associative |
| `2(3 + 4)` | `14` | `14` | ✅ Implicit Multiplication |
| `sqrt(144)` | `12` | `12` | ✅ Verified |
| `sqrt(-4)` | Domain Error | `"Cannot compute square root of negative number"` | ✅ Handled |

---

## 📱 Responsive Testing Matrix

- **Desktop (1440px+):** Expansive, centered layout with dual-grid scientific expansion and desktop toolbars.
- **Laptop (1024px):** Balanced scaling and optimal hit targets.
- **Tablet (768px):** Adaptive vertical layout with full scientific accessibility.
- **Mobile (425px & 375px):** Touch-friendly 48px+ buttons, responsive clamp typography, zero horizontal scrolling, and fluid drawers.

---

## 👨‍💻 Author & Internship Details

- **Project Name:** NOVA CALC
- **Program:** Code Alpha Internship Program
- **Track:** Frontend Development / UI/UX Design
- **Built with:** HTML5, CSS3, Vanilla JavaScript (ES6+), Web Audio API, Web Storage API
