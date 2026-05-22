# RaaJS v2.2: The Art of Minimalist Reactivity
```
    ____              _______
   / __ \____ _____  / / ___/
  / /_/ / __ `/ __ `/ /\__ \ 
 / _, _/ /_/ / /_/ / /___/ / 
/_/ |_|\__,_/\__,_/_//____/  v2.2
                             
Reactive. Declarative. HTML-First.
A tiny frontend core with a clever, extensible mindset.
```

🌐 Language:
- [English](./README.md)
- [Bahasa Indonesia](./README.id-ID.md)

---

## 🇬🇧 The RaaJS Manifesto

### What is RaaJS?
**RaaJS v2.2** is a *micro-framework* for the frontend that worships *HTML-first architecture*, *reactive state*, and *declarative directives*. In this version, we introduce a new, far more disciplined and structured standard through **Namespaced Directives**: `raa-core`, `raa-bind`, `raa-flow`, and `raa-on`.

RaaJS is built specifically for developers who want to craft powerful, interactive UIs without getting trapped in the drama of complex *toolchains* or exhausting *build* processes.

### Philosophy: Racing Bike vs. Warship
If the modern frontend ecosystem feels like **bringing a massive warship just to deliver a slice of bread** across the street—grand and heavily armed, yet incredibly heavy and exhausting—then RaaJS chooses a different path.

> RaaJS is a **nimble, efficient, lightweight carbon racing bike**. It's not designed to win a contest of feature bloat, but to ensure your bread reaches its destination on time with minimal energy. Readability, tranquility, and full sovereignty over your original HTML document are the highest values we uphold.

### Key Features in v2.2
* **Zero Build Fatigue:** Forget complex bundler configurations. Just load the script via browser, write your HTML, and your app runs instantly.
* **Island Architecture (`raa-eco:island`):** Isolate specific parts of your application into independent, self-contained *state* zones. Large apps stay light thanks to partial hydration.
* **Built-in XSS Protection:** Security is paramount. Every text and HTML *data binding* is strictly protected via automatic sanitization mechanisms.
* **Advanced Priority Scheduler:** The internal reactivity engine uses a smart, priority-based queue *batching* system. The DOM updates only when needed for high performance without lag.

---

## 📦 CDN Installation

RaaJS is designed for instant use. Simply add `<script>` tags to your HTML—no npm, no webpack, no hassle.

### 🔗 Core Engine + Extensions (Full Recommended Setup)

```html
<!-- Core Engine: Jantung dan otak reaktivitas -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>

<!-- Extensions: Superpower tambahan sesuai kebutuhan -->

<!-- 1. Data & Logic Extensions -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-http.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-eventbus.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-computed-watch.min.js"></script>

<!-- 2. UI & Experience Extensions -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-animation.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-validate.min.js"></script>

<!-- 3. Structure, Scaling & Debugging -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-template.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-i18n.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-devtools.min.js"></script>
```

### 🎯 Other Installation Options

| Use Case | Snippet |
|----------|---------|
| **Core Only** (for minimal projects) | `<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>` |
| **Core + HTTP + Validate** (forms & APIs) | Add `raa-http.min.js` and `raa-validate.min.js` after core |
| **Core + UI + Animation** (visual interactions) | Add `raa-ui.min.js` and `raa-animation.min.js` after core |
| **Development Version** (with sourcemaps) | Replace `raa.min.js` → `raa.js` (without `.min`) |

> 💡 **Versioning Tips:** 
> - Use `@2.2.0` to lock to a specific version (recommended for production).
> - Use `@latest` if you want automatic updates (beware of breaking changes).
> - `.min.js` files are compressed for production; use non-minified files only during development for easier debugging.

### 🌍 Browser Support
RaaJS v2.2 supports modern browsers with ES6+ compatibility:
- ✅ Chrome 49+
- ✅ Firefox 18+
- ✅ Safari 10+
- ✅ Edge 49+
- ✅ Opera 36+
- ✅ Android WebView & Chrome for Android
- ✅ iOS Safari 10+

---

## 🛠️ Syntax Guide v2.2 (New Standard)

In version 2.2, we deprecate the old syntax and fully adopt the *Namespaced* architecture. Attributes are organized by functional domain to avoid confusion for both browsers and developers.

| Directive Namespace | Purpose | Technical Example |
|---|---|---|
| `raa-core:*` | App initialization, *data seeding*, & element mapping | `raa-core:app="myApp"`<br>`raa-core:ref="button"` |
| `raa-bind:*` | Data binding to UI (one-way or two-way) | `raa-bind:text="count"`<br>`raa-bind:model="username"` |
| `raa-flow:*` | Conditional layout & declarative list management | `raa-flow:if="isAdmin"`<br>`raa-flow:for="item in items"` |
| `raa-on:*` | Event registration with declarative modifiers | `raa-on:click.prevent="submit"` |
| `raa-eco:*` | Architectural extensions, stability, & *global state* | `raa-eco:island`<br>`raa-eco:persist` |

---

## ⚡ Quick Start Guide

### 1. Define Your Application (JavaScript)
Register your app's data logic (*state*) and functions (*methods*) cleanly using `RaaJS.define`.

```javascript
// app.js
RaaJS.define('counterApp', () => ({
  state: {
    count: 0
  },
  methods: {
    increment() {
      this.count++;
    }
  }
}));
```

### 2. Craft Your HTML
Write declarative instructions directly in your HTML elements. Honest, intuitive, and expressive.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter App - RaaJS</title>
</head>
<body>
  <div raa-core:app="counterApp">
    <!-- Data Binding automatically protected from XSS -->
    <h1 raa-bind:text="'Total Clicks: ' + count"></h1>
    
    <!-- Event Listener with internal method -->
    <button raa-on:click="increment">Increment Count</button>
    
    <!-- Control Flow using native template element -->
    <template raa-flow:if="count > 10">
      <p>Wow, so many clicks collected! 🎉</p>
    </template>
  </div>

  <!-- Load Core Engine -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>
  <!-- Load App Definition -->
  <script src="app.js"></script>
</body>
</html>
```

---

## 📖 Official Directive Dictionary

Think of *directives* like instructions on a smart kitchen appliance: you just attach the attribute in HTML, and let the RaaJS "engine" do the work in the browser's kitchen.

### 1. RaaJS Core Directives (System Heart)
Provided directly by `raa.js` to control the fundamental application lifecycle.

* **`raa-core:app`**: Defines the *Root* or absolute boundary of a RaaJS application's domain.
* **`raa-core:data`**: Injects raw data or initial *state* as a literal object directly from HTML.
* **`raa-core:ref`**: Assigns a unique label to an element for direct JavaScript access via `$refs`.
* **`raa-core:init`**: Executes instant logic expressions right when the element is first assembled.

### 2. Data Binding & Flow Control (Reactivity Flow)
Sacred instructions for connecting the data world with the browser's visual world.

* **`raa-bind:text`**: Renders plain text into an element (highly XSS-safe).
* **`raa-bind:html`**: Injects dynamic HTML structures that have passed automatic sanitization.
* **`raa-bind:model`**: Instant two-way synchronization between form inputs and *state* properties.
* **`raa-bind:class`**: Dynamically adds or removes CSS classes based on boolean calculations.
* **`raa-bind:style`**: Reactively manipulates an element's inline CSS styles.
* **`raa-bind:[attribute]`**: Binds any native attribute (`src`, `href`, `disabled`, `placeholder`, etc.) to data.
* **`raa-flow:show`**: Hides an element visually via CSS `display: none` without removing its structure.
* **`raa-flow:if`**: Completely removes or inserts an element into/from the DOM (must be used on `<template>`).
* **`raa-flow:for`**: Performs precise list rendering using the `<template>` tag.
* **`raa-on:[event]`**: Listens to native browser events (`click`, `submit`, `input`, etc.) with tactical modifiers like `.prevent` or `.stop`.

### 3. Ecosystem & UX Enhancements (Specialist Features)
Built-in ecosystem directives for application stability and enhanced visual functionality.

* **`raa-eco:island`**: Creates an *Island*—a zone with isolated, self-contained *state* within a larger app.
* **`raa-eco:persist`**: Automatically saves and restores *state* data from `localStorage`.
* **`raa-eco:auth`**: Reactively controls element visibility based on user login status.
* **`raa-ux:focus`**: Automatically focuses the cursor on an element when it first appears on screen.
* **`raa-ux:loading`**: Injects a visual loading state and attaches the accessibility attribute `aria-busy="true"`.
* **`raa-ux:disable`**: Reactively disables interactive elements based on *state* conditions.
* **`raa-ux:lazy`**: Defers reactive compilation of an element until it physically enters the viewport.

---

## 🧩 Extension Directives (Extra Power from Modules)

Through elegant *monkey-patching* into the main prototype, you can attach additional "superpowers" from our external modules without ever polluting your core application code.

### A. Animations & Transitions (`raa-animation.js`)
* **`raa-animation:*`**: Enables the reactive animation engine via tactical wildcards: `enter`, `leave`, `scroll`, `loop`, `trigger`, and `group`.
* **`raa-animation:config`**: Writes animation configuration—duration, easing, and detailed parameters—directly on the related element.

### B. Networking & REST API (`raa-http.js`)
* **`raa-http:[method]`**: Fires REST API endpoints (`get`, `post`, `put`, `patch`, `delete`) directly from HTML element interactions.
* **`raa-http:reactive`**: Enables smart observer mode; automatically re-triggers API calls whenever variables in the URL string change.
* **`raa-http:poll`, `raa-http:debounce`, `raa-http:throttle`**: Controls network interaction speed, keystroke delays, or periodic data-fetch intervals.
* **`raa-on:http:[event]`**: Reactively captures network response lifecycle events via `success`, `error`, `finally`, and `abort`.

### C. Component UI (`raa-ui.js`)
* **`raa-ui:tooltip`**: Automatically shows a floating help tooltip when the cursor hovers over an element.
* **`raa-ui:clipboard`**: Copies target text to the user's system clipboard with a single tap.
* **`raa-ui:scroll-to`**: Smooth-scrolls the viewport to a specific target element.
* **`raa-ui:mask`**: Strictly locks user input patterns (e.g., phone number, currency, or credit card formats).
* **`raa-ui:outside`**: Detects clicks occurring outside the element's area (ideal for closing modals/dropdowns).

### D. Automatic Form Validation (`raa-validate.js`)
* **`raa-validate:[rule]`**: Applies instant validation rules to input fields like `required`, `email`, `min`, `max`, and regex patterns.
* **`raa-validate:group`**: Groups all error indicators (*error messages*) into a single collective form unit.

### E. Modular Templates & Localization
* **`raa-template:define` & `raa-template:use`**: Declaration and reuse of modular HTML block fragments without requiring complex *Web Components* architecture.
* **`raa-i18n:locale`**: Switches the application language globally and instantly across the entire page without reloading.
* **`raa-on:event:*`**: Super-fast communication channel for handling cross-component messages using the *Event Bus* management system.

---

## 🔄 Migrating from v2.1 to v2.2

If you're a previous version user, here are the main changes to note:

| v2.1 (Deprecated) | v2.2 (New Standard) | Description |
|------------------|---------------------|-------------|
| `raa-app` | `raa-core:app` | More explicit namespace |
| `raa-text` / `raa-html` | `raa-bind:text` / `raa-bind:html` | Binding grouped under `raa-bind` |
| `raa-if` / `raa-for` | `raa-flow:if` / `raa-flow:for` | Flow control separated |
| `raa-click` | `raa-on:click` | Event handlers centralized |
| `raa-island` | `raa-eco:island` | Ecosystem architecture |

> ⚠️ **Note:** v2.1 syntax is temporarily supported for backward compatibility but will be fully removed in v3.0. Migration is strongly recommended.

---

## 📜 Philosophy: Simplicity with Discipline

> *"Simplicity is not the absence of power. It is power disciplined."*

RaaJS v2.2 proves that to build reliable modern applications, we don't need to pile on new architectures that further alienate us from the web's original foundations. The main job of a tool is to remove friction, not to add new rituals.

Welcome back home to an ecosystem that's calm, clear, and enjoyable. Happy building with RaaJS! ✨

---

## 🤝 Contributing & Community

RaaJS is an *open-source* project grown from a love for web simplicity. We welcome contributions in the form of:

- 🐛 Bug reports or issues
- 💡 Feature ideas or documentation improvements
- 🌐 Translations to other languages
- 🎨 Example projects or starter templates

🔗 **Official Repository:** [github.com/dazep01/raajs](https://github.com/dazep01/raajs)  
🗨️ **Discussions & Q&A:** [GitHub Discussions](https://github.com/dazep01/raajs/discussions)  
📬 **Maintainer Contact:** [@dazep01](https://github.com/dazep01)

> 🕊️ *Crafted with ❤️ for developers who believe: a good web is a web that stays human.*
