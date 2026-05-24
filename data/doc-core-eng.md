# RaaJS v3.1.0 — Complete Core Framework Documentation

> **Version:** 3.1.0 "Data Liberation" | **Release:** 2026-05-24  
> **Update:** Starting with this version, `raa-core:data` has been removed. Use `raa-core:init` or `RaaJS.define` to declare state.  
>
> *"Simplicity is disciplined power."*

---

## 🗺️ Table of Contents

1. [What is RaaJS?](#1-what-is-raajs)
2. [How to Install RaaJS](#2-how-to-install-raajs)
3. [Core Concept: Reactivity](#3-core-concept-reactivity)
4. [Your First Application](#4-your-first-application)
5. [Core Directives (`raa-core:`)](#5-core-directives-raa-core)
6. [Binding Directives (`raa-bind:`)](#6-binding-directives-raa-bind)
7. [Control Flow Directives (`raa-flow:`)](#7-control-flow-directives-raa-flow)
8. [Event Directives (`raa-on:`)](#8-event-directives-raa-on)
9. [Ecosystem Directives (`raa-eco:`)](#9-ecosystem-directives-raa-eco)
10. [Network Directives (`raa-net:`)](#10-network-directives-raa-net)
11. [UX Directives (`raa-ux:`)](#11-ux-directives-raa-ux)
12. [Template Expression Language](#12-template-expression-language)
13. [RaaJS Public API](#13-raajs-public-api)
14. [Plugin System](#14-plugin-system)
15. [Quick Reference: All Directives](#15-quick-reference-all-directives)
16. [Troubleshooting & Tips](#16-troubleshooting--tips)

---

## 1. What is RaaJS?

RaaJS is a **reactive, lightweight, no-build micro-frontend framework**. You simply include one JavaScript file into your HTML page, and instantly your HTML becomes alive — moving, reacting, and changing with user interaction.

### 🎯 Who is RaaJS For?

- **Beginners** just learning JavaScript who want to see reactivity in action.
- **Experienced developers** who need something lightweight without toolchain complexity.
- **Small teams** who want to add interactivity to existing static HTML pages.
- Anyone tired of configuring webpack/vite just to make a button change color 😄

### ✨ What Makes RaaJS Special?

| Feature | Explanation |
|---|---|
| **No-Build** | Just `<script src="...">` and you're done. No npm, webpack, or vite needed. |
| **Zero Dependency** | No reliance on other libraries. Completely self-sufficient. |
| **HTML-First** | Logic written directly in HTML attributes. Feels natural and easy to read. |
| **Reactive** | Data changes automatically update the view. You never need to write DOM update code manually. |
| **CSP-Safe** | Uses its own AST parser, not `eval()` or `new Function`. Safe under strict Content Security Policy. |
| **Island-Capable** | Isolated components can coexist on the same page. |
| **Plugin-Extensible** | Capabilities can be extended with a modular plugin ecosystem. |

---

## 2. How to Install RaaJS

Installing RaaJS is as easy as adding one line to your HTML.

### Option A: Directly from Local File

Download `raa-v3.1.0.js` and save it in your project, then add:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Application</title>
</head>
<body>

  <!-- Your app content here -->

  <!-- Load RaaJS before closing </body> -->
  <script src="raa.js"></script>
</body>
</html>
```

RaaJS will **automatically run** when the page finishes loading (`DOMContentLoaded`) and look for all elements with the `raa-core:app` attribute to compile them.

### Option B: Adding Extensions

If you need additional features (animations, validation, etc.), simply add extension files **after** the core file:

```html
<script src="raa.js"></script>
<script src="extensions/raa-validate.js"></script>
<script src="extensions/raa-animation.js"></script>
```

> **⚠️ Important Order!** The core file (`raa.js`) must **always be loaded first** before any extensions.

---

## 3. Core Concept: Reactivity

Before writing code, it's important to understand one key concept that is the heart of RaaJS: **Reactivity**.

### Imagine a Spreadsheet

You've probably used Excel or Google Sheets. When you change the value in cell A1, all formulas in other cells that refer to A1 will **automatically update** immediately. That's reactivity!

**RaaJS** works exactly the same way:
1. You have **State** (your application's data). For example: `{ count: 0 }`.
2. You connect State to the HTML view using **Directives**. For example: `raa-bind:text="count"`.
3. Every time the State changes, RaaJS **automatically updates** the connected view. You never need to write `document.getElementById('...').textContent = count` manually.

### How Does RaaJS Do This?

RaaJS uses a modern JavaScript technology called **Proxy**. Think of a Proxy as a "smart courier" that watches every change on your state object. When a change happens, this courier notifies all parts of the UI that need to be updated.

```
State Changes → Proxy Detects → Effect Scheduled → DOM Updated
```

You don't need to understand the details to start using it — just know that **data change = automatic view update**.

---

## 4. Your First Application

Let's build the classic "Counter" application as an introduction. There are two ways to declare state in RaaJS:

- **`RaaJS.define`** (recommended) — for applications with logic and interaction.
- **`raa-core:init`** — for simple initial data (read-only or combined with a factory).

We'll focus on the recommended approach.

### Interactive Counter with `RaaJS.define`

```html
<!-- HTML: Clean and declarative -->
<div raa-core:app="counter">
  <h2>Simple Counter</h2>
  <p>Current value: <strong raa-bind:text="count"></strong></p>

  <button raa-on:click="increment()">➕ Increment</button>
  <button raa-on:click="decrement()">➖ Decrement</button>
  <button raa-on:click="reset()">🔄 Reset</button>

  <template raa-flow:if="count > 10">
    <p style="color: red;">Wow, it's already over 10!</p>
  </template>
</div>

<script src="raa.js"></script>
<script>
  RaaJS.define('counter', () => ({
    state: {
      count: 0
    },
    methods: {
      increment() { this.count += 1; },
      decrement() { this.count -= 1; },
      reset()  { this.count = 0; }
    }
  }));
</script>
```

**What's happening here?**
- `raa-core:app="counter"` → Root of an application named 'counter'.
- `RaaJS.define('counter', ...)` → Registers initial state and methods.
- `raa-bind:text="count"` → Displays the `count` value, updates automatically.
- `raa-on:click="increment()"` → Calls the `increment` method when the button is clicked.
- `<template raa-flow:if="count > 10">` → Content only appears if `count > 10`.

> **💡 Did you know?**  
> In JavaScript, `count += 1` can be written as `count++`. For beginners, we'll use the explicit version first.

### Simple State Initialization with `raa-core:init`

If you only need to display initial data without methods, use `raa-core:init` to inject state directly:

```html
<div raa-core:app="static" raa-core:init="Object.assign($state, { message: 'Hello World', year: 2026 })">
  <p raa-bind:text="message"></p>
  <p>Year: <span raa-bind:text="year"></span></p>
</div>
```

For interactive applications, however, **always use `RaaJS.define`** as in the example above.

---

## 5. Core Directives (`raa-core:`)

Core directives are the foundation of every RaaJS application. They control compilation, state, and initialization.

### `raa-core:app`

**Purpose:** Marks an HTML element as the *root* of a RaaJS application and connects it to an application definition created with `RaaJS.define`.

**Syntax:** `raa-core:app="appName"`

```html
<div raa-core:app="todoApp">
  <!-- All content inside is managed by 'todoApp' -->
</div>
```

```javascript
RaaJS.define('todoApp', () => ({
  state: { items: [] },
  methods: { /* ... */ }
}));
```

**Important Points:**
- A page can have **more than one** application, each **isolated**.
- The name in HTML must **exactly match** the name in `RaaJS.define`.
- If the name is not found, RaaJS will display a warning and suggest the closest match.

---

### `raa-core:init`

**Purpose:** Evaluates an expression **once** when the element is first compiled. Useful for state initialization, calling startup functions, or preparing initial data.

**Syntax:** `raa-core:init="expression"`

```html
<!-- Inline state initialization -->
<div raa-core:app="myApp" raa-core:init="Object.assign($state, { ready: true, data: [] })">
  <p raa-bind:text="ready ? 'App ready' : 'Loading...'"></p>
</div>

<!-- Calling a startup method -->
<div raa-core:app="timerApp">
  <div raa-core:init="start()">
    <p>Time: <span raa-bind:text="seconds"></span> seconds</p>
  </div>
</div>

<script>
  RaaJS.define('timerApp', () => ({
    state: { seconds: 0, _interval: null },
    methods: {
      start() {
        this._interval = setInterval(() => { this.seconds++; }, 1000);
      }
    }
  }));
</script>
```

**Difference between `raa-core:init` and `init()` in `RaaJS.define`:**

| | `raa-core:init` in HTML | `init()` in `RaaJS.define` |
|---|---|---|
| **When it runs** | When the specific element is compiled | After the entire root is compiled |
| **Can there be more than one?** | Yes, one per element | No, only one per definition |
| **Best for** | Per-element initialization | Global application initialization |

> **Migration Note from v3.0.0:**  
> `raa-core:data` has been removed. Use `raa-core:init` with `Object.assign($state, { ... })` for inline state declaration.

---

### `raa-core:ref`

**Purpose:** Gives a reference name to a DOM element, which can be accessed from JavaScript via `this.$refs.refName`.

**Syntax:** `raa-core:ref="referenceName"`

```html
<div raa-core:app="formApp">
  <input type="email" raa-core:ref="emailInput" raa-bind:model="email">
  <button raa-on:click="focusEmail()">Focus Email</button>
</div>

<script>
  RaaJS.define('formApp', () => ({
    state: { email: '' },
    methods: {
      focusEmail() {
        this.$refs.emailInput.focus();
      }
    }
  }));
</script>
```

---

## 6. Binding Directives (`raa-bind:`)

Bindings connect data to the DOM reactively.

### `raa-bind:text`

Displays safe (escaped) text.

```html
<span raa-bind:text="name"></span>
<span raa-bind:text="'Hello, ' + name + '!'"></span>
<span raa-bind:text="score >= 90 ? 'Pass' : 'Try again'"></span>
```

### `raa-bind:html`

Displays sanitized HTML.

```html
<div raa-bind:html="articleContent"></div>
```

**Allowed tags:** `a, b, blockquote, br, code, div, em, h1-h6, hr, i, img, li, ol, p, pre, section, span, strong, sub, sup, table, tbody, td, th, thead, tr, u, ul, small`. Event attributes (`onclick`, etc.) are automatically removed.

### `raa-bind:model`

Two-way binding for form elements.

```html
<input type="text" raa-bind:model="name">
<input type="checkbox" raa-bind:model="agreed">
<select raa-bind:model="city">...</select>
<input type="radio" raa-bind:model="choice" value="A">
<textarea raa-bind:model="message"></textarea>
<!-- Nested -->
<input raa-bind:model="user.address">
```

### `raa-bind:class`

Dynamic CSS classes via object or array.

```html
<div raa-bind:class="{ active: isActive, 'text-red': error }"></div>
<div raa-bind:class="['base', isActive ? 'active' : '']"></div>
```

### `raa-bind:style`

Dynamic inline style (camelCase).

```html
<p raa-bind:style="{ color: color, fontSize: size + 'px' }"></p>
```

### `raa-bind:[attr]`

Generic HTML attributes.

```html
<a raa-bind:href="url">Link</a>
<img raa-bind:src="image" raa-bind:alt="description">
<button raa-bind:disabled="!valid">Submit</button>
```

A value of `false`, `null`, or `undefined` will remove the attribute.

---

## 7. Control Flow Directives (`raa-flow:`)

### `raa-flow:if`

Conditional rendering with `<template>`.

```html
<template raa-flow:if="visible">
  <p>Content that appears if visible is true</p>
</template>
```

### `raa-flow:for`

Loop with keyed diffing.

```html
<template raa-flow:for="item in items" raa-key="item.id">
  <li raa-bind:text="item.name"></li>
</template>
```

**With index:** `"item, i in items"` → `i` is the index.

**Nested loops:** allowed, each `<template>` has its own scope.

### `raa-flow:show`

Toggle `display` without destroying the element.

```html
<div raa-flow:show="open">Hidden/visible content</div>
```

---

## 8. Event Directives (`raa-on:`)

```html
<button raa-on:click="action()">Click</button>
<input raa-on:keyup="check($event)">
<form raa-on:submit.prevent="submit()">
```

**Modifiers:**
- `.prevent` → `event.preventDefault()`
- `.stop` → `event.stopPropagation()`
- `.self` → only if `event.target` is the element itself

---

## 9. Ecosystem Directives (`raa-eco:`)

### `raa-eco:persist`

State automatically saved to `localStorage`.

```html
<div raa-core:app="settings" raa-eco:persist="main-key">
  <input type="checkbox" raa-bind:model="darkMode">
</div>
```

### `raa-eco:island`

Isolated component with its own state.

```html
<div raa-eco:island raa-core:init="Object.assign($state, { counter: 0 })">
  <p raa-bind:text="counter"></p>
  <button raa-on:click="counter++">Increment</button>  <!-- needs a method in factory? -->
</div>
```

> *Note:* `counter++` in the template is not supported without a method. For interactions inside an island, define methods in the root factory or use `raa-on:click` that calls an already provided method.

### `raa-eco:router` and `raa-eco:route`

Hash-based router.

```html
<div raa-core:app="spa" raa-eco:router>
  <nav>
    <a href="#/">Home</a>
    <a href="#/about">About</a>
  </nav>
  <div raa-eco:route="/"><h2>Home</h2></div>
  <div raa-eco:route="/about"><h2>About</h2></div>
</div>
```

---

## 10. Network Directives (`raa-net:`)

### `raa-net:fetch`

Automatic fetch on mount, aborts on destroy.

```html
<div raa-core:app="cityData" raa-net:fetch="'https://api.example.com/cities' -> cityList">
  <template raa-flow:for="city in cityList" raa-key="city.id">
    <p raa-bind:text="city.name"></p>
  </template>
</div>
```

### `raa-net:sync`

Real-time WebSocket.

```html
<div raa-net:sync="'ws://chat.server/room' -> newMessage">
  <p raa-bind:text="newMessage.content"></p>
</div>
```

---

## 11. UX Directives (`raa-ux:`)

- `raa-ux:lazy` — delays binding until the element is visible in the viewport.
- `raa-ux:focus` — auto-focus on first render.
- `raa-ux:loading="condition"` — adds `raa-loading` class and `aria-busy`.
- `raa-ux:disable="condition"` — toggles the `disabled` attribute.

---

## 12. Template Expression Language

**Supported:** literals, identifiers, member access (`a.b`, `a['b']`, `a?.[0]`), arithmetic, comparison, logical (`&&`, `||`), ternary, object literal, array literal, function calls, safe globals (`Math`, `Date`, `JSON`, `console`, etc.), `$event`, `$state`, `$refs`, `$el`, `$store`, `$index`, `$locals`.

**Not supported:** `??`, template literals, destructuring, spread, assignment (`=`), `new`, arrow functions, `async/await`. Use the alternatives described.

---

## 13. RaaJS Public API

- `RaaJS.define(name, factory)` — register an application.
- `RaaJS.defineGlobal(name, value)` — safely add globals to all templates.
- `new RaaJS(config?)` — manual instance.
- `raa.mount(target)` — compile an element.
- `raa.use(plugin, options?)` — install a plugin.
- `raa.nextTick(fn?)` — execute after microtasks are finished.

---

## 14. Plugin System

Plugins have the structure `{ name, install(raa, options), uninstall? }`. They can register custom directives, lifecycle hooks (`beforeCompile`, `afterCompile`, `beforeDestroy`, `afterDestroy`), and dependencies.

---

## 15. Quick Reference: All Directives

| Directive | Purpose | Example |
|---|---|---|
| `raa-core:app` | Application root | `raa-core:app="appName"` |
| `raa-core:init` | One‑time initialization | `raa-core:init="Object.assign($state, { x: 1 })"` |
| `raa-core:ref` | Element reference | `raa-core:ref="button"` |
| `raa-bind:text` | Reactive text | `raa-bind:text="name"` |
| `raa-bind:html` | Reactive HTML | `raa-bind:html="content"` |
| `raa-bind:model` | Two‑way binding | `raa-bind:model="email"` |
| `raa-bind:class` | Dynamic CSS classes | `raa-bind:class="{ active: isActive }"` |
| `raa-bind:style` | Dynamic CSS style | `raa-bind:style="{ color: color }"` |
| `raa-bind:[attr]` | Generic attribute | `raa-bind:href="url"` |
| `raa-flow:if` | Conditional render | `<template raa-flow:if="visible">` |
| `raa-flow:for` | Loop render | `<template raa-flow:for="item in list">` |
| `raa-flow:show` | Show/hide | `raa-flow:show="isVisible"` |
| `raa-on:[event]` | Event handler | `raa-on:click="submit()"` |
| `raa-eco:persist` | Persist to localStorage | `raa-eco:persist="my-key"` |
| `raa-eco:island` | Isolated component | `raa-eco:island` |
| `raa-eco:router` | Enable router | `raa-eco:router` |
| `raa-eco:route` | Route definition | `raa-eco:route="/path"` |
| `raa-net:fetch` | HTTP GET on mount | `raa-net:fetch="'url' -> data"` |
| `raa-net:sync` | WebSocket sync | `raa-net:sync="'ws://url' -> data"` |
| `raa-ux:lazy` | Lazy compile | `raa-ux:lazy` |
| `raa-ux:focus` | Auto focus | `raa-ux:focus` |
| `raa-ux:loading` | Loading class | `raa-ux:loading="isLoading"` |
| `raa-ux:disable` | Dynamic disable | `raa-ux:disable="!valid"` |

---

## 16. Troubleshooting & Tips

**❓ State not reactive?** Make sure the property already exists in the initial state declaration. Adding properties after compilation won't be tracked.

**❓ Expression error?** Check the console for `[RaaJS warn:EVAL_FAIL]` messages. Avoid unsupported syntax (`??`, template literals, etc.).

**❓ App not found?** Ensure the name in `raa-core:app` matches the one in `RaaJS.define`, and that the script runs before the DOM is parsed (or use `defer`).

**💡 Performance Tips:** Use stable `raa-key`, `raa-ux:lazy` for off-screen content, `raa-flow:show` for fast toggling, and avoid heavy expressions in templates.

---

*This documentation covers the core RaaJS v3.1.0 file. For extensions, see their respective documentation.*

---
