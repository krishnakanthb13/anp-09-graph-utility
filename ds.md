# Feature Specification & Implementation Plan: Math Formula & Function Plotter

## 1. Overview & Architectural Goal

Extend **Graph Utility** beyond markdown table extraction to include a native **Math Formula / Function Plotter** mode. Users can input mathematical expressions $y = f(x)$, configure domains and step resolutions, and plot smooth interactive curves in Chart.js, with the ability to export the resulting graph to the active note as an image or generate $(x, y)$ coordinate markdown tables.

```text
[ User Formula Input ] (e.g., sin(x) * x, x^2 - 4x + 3)
         ↓
[ Safe Math Tokenizer & AST / Evaluator ]
         ↓
[ Sampling Engine (Domain [xmin, xmax], Step, Singularity Guard) ]
         ↓
┌────────────────────────────────────────────────────────┐
│                   Chart.js Canvas                      │
│ (Scatter/Line Mode, Cartesian Grids, Coordinate Hover) │
└────────────────────────────────────────────────────────┘
         │
         ├──► Export Graph Image to Note
         └──► Insert (x, y) Markdown Table to Note
```

---

## 2. Step-by-Step Implementation Breakdown

### Phase 1: Math Expression Parsing & Evaluation Engine
* **Target File**: `lib/utils/mathEvaluator.js`
* **Core Tasks**:
  1. **Tokenizer & Parser**:
     - Parse arithmetic operators: `+`, `-`, `*`, `/`, `^`, `%`, and parentheses `()`.
     - Support mathematical constants: `pi`, `e`, `tau`, `phi`.
     - Handle implicit multiplication: `2x` $\to$ `2*x`, `3sin(x)` $\to$ `3*sin(x)`, `(x+1)(x-1)`.
  2. **Standard Function Library**:
     - Trigonometric: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`.
     - Hyperbolic: `sinh`, `cosh`, `tanh`.
     - Logarithmic & Exponential: `log` ($\log_{10}$), `ln` ($\log_e$), `exp`, `sqrt`, `cbrt`, `pow`.
     - Rounding & Utilities: `abs`, `floor`, `ceil`, `round`, `sign`, `min`, `max`.
  3. **Defensive Runtime Evaluation**:
     - Zero-division, imaginary results (e.g. $\sqrt{-1}$ without complex mode), and asymptote handling ($\tan(\frac{\pi}{2})$) sanitized to `null`/`NaN` to prevent Chart.js crashes.
     - Strict execution sandbox (no `eval()` or dangerous code execution).

---

### Phase 2: Domain Sampling & Multi-Series Engine
* **Target File**: `lib/utils/formulaSampler.js`
* **Core Tasks**:
  1. **Domain Sampling**:
     - Sample points across range $[x_{min}, x_{max}]$ with configurable point count (e.g., 200–500 sample points).
     - Support linear and logarithmic step scaling.
  2. **Multi-Formula Series**:
     - Support multiple simultaneous curves (e.g., $f_1(x) = \sin(x)$, $f_2(x) = \cos(x)$).
     - Assign harmonious color palettes to each series matching Graph Utility's cyclic theming.
  3. **Dataset Formatting for Chart.js**:
     - Format samples into `{ x: number, y: number }` coordinates compatible with Chart.js line/scatter datasets.
     - Calculate automatic $y$-axis bounds with clamping for discontinuous spikes.

---

### Phase 3: Workbench UI & Mode Switcher
* **Target File**: `lib/ui/htmlTemplate.js`
* **Core Tasks**:
  1. **Source Mode Selector**:
     - Add top workbench toggle: **"Markdown Tables"** vs **"Math Formula Plotter"**.
  2. **Formula Controls Panel**:
     - Formula input fields with dynamic "+ Add Function" series management.
     - Domain controls: $x_{min}$, $x_{max}$, and resolution slider.
     - Presets library dropdown (e.g., Quadratic, Sine Wave, Sigmoid, Gaussian / Normal Distribution, Damped Harmonic Oscillator).
  3. **Live Interactive Canvas**:
     - Render smooth spline curves (`tension: 0.2–0.4`) with Cartesian zero-axes indicators ($x=0, y=0$).
     - Tooltips displaying exact coordinate precision $(x, f(x))$.
     - Debounced evaluation on formula typing with real-time syntax validation / error badges.

---

### Phase 4: Amplenote Integration & Action Handlers
* **Target File**: `lib/features/onEmbedCall.js`
* **Core Tasks**:
  1. **Export Graph Image to Note**:
     - Retain current canvas snapshot export to insert high-resolution PNG math plot into the active note.
  2. **Generate Coordinate Markdown Table**:
     - Provide an action button: **"Insert Table to Note"**.
     - Formats sampled points as a standard Markdown table:
       ```markdown
       | x | f(x) = sin(x) | g(x) = cos(x) |
       |---|---|---|
       | -3.14 | 0.00 | -1.00 |
       ...
       ```
  3. **State Persistence**:
     - Persist active formulas, range settings, and view mode inside Amplenote's plugin state object so user setups are restored across sessions.

---

### Phase 5: Verification, Testing & Bundling
* **Target Files**: `test/`, `build/`, documentation files
* **Core Tasks**:
  1. **Unit Testing**:
     - Test evaluator on edge cases: operator precedence, invalid syntax, division by zero, extreme domains.
  2. **Integrity & Performance Checks**:
     - Verify smooth UI rendering at 60fps with up to 1,000 sampled points.
     - Ensure zero regression on existing markdown table parsing and chart features.
  3. **Bundle & Documentation**:
     - Run `anp_bundle` to produce the single-file distribution bundle.
     - Update `README.md`, `CODE_DOCUMENTATION.md`, and `RELEASE_NOTES.md`.

