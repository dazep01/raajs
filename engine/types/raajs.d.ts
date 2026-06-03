// engine/types/raajs.d.ts
// RaaJS v3.1.0 "Data Liberation" — TypeScript Definitions
// Author: RaaJS Expert System

declare global {
  // =========================================================================
  // 1. WINDOW GLOBALS (Core + All Extensions)
  // =========================================================================
  interface Window {
    /** 
     * Instance utama RaaJS yang aktif. Auto-created saat DOMContentLoaded.
     * Gunakan untuk akses API internal: `Raa.mount()`, `Raa.use()`, dll.
     */
    Raa: RaaJSClass;
    
    /** 
     * Class constructor RaaJS. Gunakan `RaaJS.define()` untuk mendaftarkan app.
     * @example RaaJS.define('counter', () => ({ state: { count: 0 } }))
     */
    RaaJS: typeof RaaJSClass;
    
    /** [Extension] EventBus global. Auto-loaded via raa-eventbus.js */
    RaaEvents?: RaaEventsAPI;
    /** [Extension] HTTP client. Auto-loaded via raa-http.js */
    RaaHttp?: RaaHttpAPI;
    /** [Extension] Form validator. Auto-loaded via raa-validate.js */
    RaaValidate?: RaaValidateAPI;
    /** [Extension] i18n engine. Auto-loaded via raa-i18n.js */
    RaaI18n?: RaaI18nAPI;
    /** [Extension] Web Animations API wrapper. Auto-loaded via raa-animation.js */
    RaaAnimation?: RaaAnimationAPI;
    /** [DevOnly] Glass Cockpit inspector. JANGAN include di production! */
    RaaDevTools?: RaaDevToolsAPI;
  }

  // =========================================================================
  // 2. CORE API & CONFIGURATION
  // =========================================================================
  
  interface RaaConfig {
    /** Shared state antar apps. Akses via `$store` di template. */
    store?: Record<string, any>;
    /** CSS selector untuk auto-mount. Default: `[raa-core\:app]` */
    rootSelector?: string;
    /** Aktifkan warning verbose di console. OFF-kan di production! */
    debug?: boolean;
    /** 
     * ⚠️ DANGER: Bypass HTML sanitization untuk `raa-bind:html`.
     * Hanya true-kan jika Anda 100% trust sumber HTML (XSS risk!).
     */
    trustHTML?: boolean;
    /** Custom sanitizer function. Menggantikan default DOMPurify-like logic. */
    sanitizer?: (html: string) => string;
  }

  /**
   * Shape plugin RaaJS. Plugin di-install via `Raa.use()`.
   * @important Gunakan INSTANCE PATCHING, bukan prototype patching (IIFE architecture).
   */
  interface RaaPlugin {
    /** Unique name. Harus unik, atau akan di-skip dengan warning PLUGIN_DUP. */
    name: string;
    /** Nama plugin lain yang harus di-install duluan. */
    depends?: string[];
    /** Dipanggil saat `Raa.use(plugin)`. Patch instance `raa` di sini. */
    install(raa: RaaJSClass, options?: any): void;
    /** Cleanup saat `Raa.uninstall(name)`. Restore original methods di sini. */
    uninstall?(raa: RaaJSClass): void;
  }

  /**
   * Base state yang di-augmentasi oleh Core & Extensions.
   * Semua properti `$xxx` di-inject otomatis ke state Anda.
   * 
   * @example
   * interface MyState { count: number }
   * RaaJS.define<MyState>('app', () => ({
   *   state: { count: 0 },
   *   methods: { inc() { this.count++; this.$refs.btn.focus(); } }
   * }))
   */
  interface RaaState {
    /** 
     * Referensi elemen DOM via `raa-core:ref="name"`.
     * ⚠️ ANTI-PATTERN: JANGAN pakai `document.querySelector()`.
     * Jika ada multiple elemen dengan ref sama, nilainya array.
     */
    $refs: Record<string, HTMLElement | HTMLElement[]>;
    
    /** Elemen root dari app saat ini. Tersedia di dalam methods. */
    $el?: HTMLElement;
    
    /** Global store dari `new RaaJS({ store: {...} })`. Shared antar apps. */
    $store: Record<string, any>;
    
    /** Local variables dari parent `raa-flow:for` scopes. */
    $locals: Record<string, any>;
    
    /** 
     * [raa-http] Status HTTP requests. Berisi: loading, success, error, data, status.
     * @example this.$http.getUser.loading // boolean
     */
    $http?: Record<string, any>;
    
    /** 
     * [raa-i18n] Translation function. 
     * @example this.$t('greeting', { name: 'Budi' }) // "Halo, Budi!"
     */
    $t?: (key: string, params?: Record<string, any>) => string;
    
    /** 
     * [raa-computed-watch] Watch state changes dynamically.
     * @example this.$watch('count', (newV, oldV) => console.log(newV))
     */
    $watch?: (path: string, callback: (newVal: any, oldVal: any) => void) => void;
  }

  /**
   * Factory shape untuk `RaaJS.define(name, factory)`.
   * Generic `<S>` memungkinkan type-safety untuk state kustom Anda.
   * 
   * @important 
   * - `state` HANYA plain object/array yang jadi reaktif. Date/RegExp/Map/Promise TIDAK.
   * - Prefix `_` untuk data non-reaktif (cache, timer): `{ _cache: new Map() }`
   * - `methods` `this` ter-bind ke reactive proxy. JANGAN pakai arrow function!
   */
  interface AppFactory<S extends Record<string, any> = Record<string, any>> {
    /** 
     * Plain object yang jadi reactive state. 
     * ⚠️ Properti baru yang TIDAK dideklarasikan di sini TIDAK akan reaktif!
     */
    state: S;
    
    /** 
     * Methods ter-bind ke state. `this` = reactive proxy.
     * ⚠️ JANGAN pakai arrow function: `inc: () => {}` akan merusak `this`.
     */
    methods?: Record<string, (this: S & RaaState, ...args: any[]) => any>;
    
    /** [raa-computed-watch] Computed properties. Lazy-evaluated & cached. */
    computed?: Record<string, (this: S & RaaState) => any>;
    
    /** [raa-computed-watch] Watcher untuk side-effects saat state berubah. */
    watch?: Record<string, (this: S & RaaState, newVal: any, oldVal: any) => void>;
    
    /** 
     * Dipanggil SETELAH root fully compiled (async-safe).
     * Ideal untuk fetch data awal atau setup subscriptions.
     */
    init?: (this: S & RaaState) => void;
  }

  /**
   * Class utama RaaJS. Hidup dalam IIFE — TIDAK bisa akses prototype dari luar.
   * Instance dibuat otomatis sebagai `window.Raa` saat DOMContentLoaded.
   */
  class RaaJSClass {
    // ── Static API ──────────────────────────────────────────────────────
    
    /** 
     * Daftarkan app factory. Nama harus match dengan `raa-core:app="name"` di HTML.
     * @example RaaJS.define('counter', () => ({ state: { count: 0 } }))
     */
    static define<S extends Record<string, any>>(name: string, factory: () => AppFactory<S>): void;
    
    /** 
     * Daftarkan safe global untuk template expressions.
     * @example RaaJS.defineGlobal('formatDate', (d) => new Date(d).toLocaleDateString())
     */
    static defineGlobal(name: string, getter: any): void;
    
    /** Registry semua app factories yang sudah didefinisikan. */
    static apps: Record<string, () => AppFactory>;

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(config?: RaaConfig);

    // ── Instance Methods ────────────────────────────────────────────────
    
    /** 
     * Manual compile root element. Biasanya auto-compile via DOMContentLoaded.
     * Gunakan untuk dynamic content yang di-inject setelah page load.
     */
    mount(target: string | HTMLElement): void;
    
    /** 
     * Install plugin. Plugin bisa object `{name, install}` atau function.
     * Function akan di-wrap sebagai `anonymous_N` plugin.
     */
    use(plugin: RaaPlugin | ((raa: RaaJSClass) => void), options?: any): this;
    
    /** 
     * Schedule callback setelah microtask flush (effect selesai).
     * @example await Raa.nextTick(); // DOM sudah update
     */
    nextTick(fn?: () => void): Promise<void>;

    // ── Internal Subsystems (Advanced/Plugin Dev) ───────────────────────
    /** EffectScheduler — microtask-batched effect execution */
    scheduler: any;
    /** ReactiveSystem — Proxy-based dependency tracking */
    reactive: any;
    /** ScopeEvaluator — AST expression parser & evaluator */
    evaluator: any;
    /** BindingApplier — DOM binding primitives (text, html, model, class) */
    bindings: any;
    /** ControlFlow — raa-flow:if dan raa-flow:for processor */
    controlFlow: any;
    /** NetworkRouter — fetch, WebSocket, hash router */
    network: any;
    /** PersistAndRefs — localStorage persistence & $refs registration */
    persist: any;
    /** PluginManager — plugin registry & lifecycle hooks */
    pluginManager: any;
    
    // ── Core Helpers (Plugin / Advanced usage) ──────────────────────────
    
    /** 
     * Evaluate template expression dengan scope resolution.
     * Scope order: $store/$refs/$el → extraLocals → ancestor locals → state → safe globals.
     */
    evaluate(expr: string, state: any, el: HTMLElement, extraLocals?: Record<string, any>): any;
    
    /** 
     * Assign value via path expression (e.g. "user.name").
     * Auto-create intermediate objects. Digunakan oleh raa-bind:model.
     */
    assign(expr: string, value: any, state: any, el: HTMLElement, extraLocals?: Record<string, any>): void;
    
    /** 
     * Buat reactive effect manual. Auto-tracked dependencies.
     * @example raa.createEffect(() => console.log(state.count), { root, element: el })
     */
    createEffect(fn: () => void, options?: any): any;
    
    /** Compile root element + semua subtree. Trigger lifecycle `beforeCompile`/`afterCompile`. */
    compileRoot(rootEl: HTMLElement): any;
    
    /** 
     * Destroy root: abort fetch, close WebSocket, dispose semua effects, deep cleanup.
     * Trigger lifecycle `beforeDestroy`/`afterDestroy`.
     */
    destroyRoot(rootEl: HTMLElement): void;
  }

  const RaaJS: typeof RaaJSClass;

  // =========================================================================
  // 3. EXTENSIONS APIs
  // =========================================================================
  
  /**
   * [raa-eventbus.js] Cross-component event bus.
   * Support wildcard: `RaaEvents.on('cart:*', handler)`
   */
  interface RaaEventsAPI {
    /** Emit event global. Data akan diterima semua listener. */
    emit(event: string, data?: any): void;
    /** Subscribe ke event. Support wildcard `*`. */
    on(event: string, handler: (data: any) => void): void;
    /** Unsubscribe handler spesifik. */
    off(event: string, handler: (data: any) => void): void;
    /** Buat bus lokal terikat ke root tertentu (isolated dari global). */
    local(rootEl: HTMLElement): { emit: Function, on: Function, off: Function };
  }

  /**
   * [raa-http.js] Declarative HTTP client.
   * Status otomatis tersimpan di `state.$http[key]` dengan shape:
   * `{ loading, success, error, status, data, response, aborted, finished }`
   */
  interface RaaHttpAPI {
    /** GET request. Return Promise. Abort otomatis saat root di-destroy. */
    get(url: string, config?: any): Promise<any>;
    /** POST request dengan body. */
    post(url: string, data?: any, config?: any): Promise<any>;
    /** PUT request. */
    put(url: string, data?: any, config?: any): Promise<any>;
    /** DELETE request. */
    delete(url: string, config?: any): Promise<any>;
    /** Interceptor untuk modify request/response global. */
    interceptors: { request: any[], response: any[] };
    /** Buat client terpisah dengan baseURL sendiri. */
    createClient(config: { baseURL?: string }): RaaHttpAPI;
  }

  /**
   * [raa-validate.js] Form validation dengan auto UI feedback.
   * Auto-add CSS `.raa-valid`/`.raa-invalid` dan `aria-invalid`.
   */
  interface RaaValidateAPI {
    /** 
     * Register custom rule. 
     * @example RaaValidate.defineRule('phone', (val) => /^\d{10,12}$/.test(val))
     */
    defineRule(name: string, validator: (value: any, param: any, el: HTMLElement) => boolean): void;
    /** Validate single input. Return true jika valid. */
    validateField(inputEl: HTMLElement): boolean;
    /** Validate seluruh form (semua input dengan raa-validate:*). */
    validateGroup(formEl: HTMLElement): boolean;
  }

  /**
   * [raa-i18n.js] Reactive internationalization.
   * Support interpolation `{name}` dan pluralization `1 item | {count} items`.
   */
  interface RaaI18nAPI {
    /** Set translations untuk locale tertentu. */
    setTranslations(locale: string, translations: Record<string, any>): void;
    /** Ganti locale aktif. Semua `$t()` akan re-render otomatis. */
    setLocale(locale: string): void;
    /** Dapatkan locale yang sedang aktif. */
    getLocale(): string;
  }

  /**
   * [raa-animation.js] Declarative Web Animations API.
   * Built-in presets: fade-up, fade-down, fade-left, fade-right, fade-in,
   * scale-in, zoom-in, flip-up.
   */
  interface RaaAnimationAPI {
    /** Play animasi pada elemen. Options: duration, easing, delay, fill. */
    play(element: HTMLElement, animation: string, options?: any): void;
    /** Play animasi stagger pada group items. */
    applyGroup(container: HTMLElement, items: HTMLElement[], options?: any): void;
  }

  /**
   * [raa-devtools.js] Glass Cockpit inspector.
   * ⚠️ JANGAN include di production! Toggle via Ctrl+Shift+R.
   */
  interface RaaDevToolsAPI {
    /** Tampilkan panel DevTools. */
    enable(): void;
    /** Sembunyikan panel. */
    disable(): void;
    /** Toggle show/hide panel. */
    toggle(): void;
    /** Bersihkan semua log (events, timeline, perf entries). */
    clear(): void;
  }
}

export {};
