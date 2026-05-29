/**
 * RaaJS HTTP Client Extension | v3.1.0
 * File: raa-http.js
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Kurir Jujur" (Honest Courier). Ekstensi ini adalah
 * jembatan komunikasi antara aplikasi dan dunia luar (Server),
 * yang bertugas membawa data masuk ke dalam state secara reaktif
 * dengan manajemen siklus request yang sangat disiplin.
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-http:[get|post|put|patch|delete] : Request langsung dari elemen.
 *   Sintaks: raa-http:get="urlExpr -> stateKey"
 * - raa-http:reactive  : GET otomatis diulang saat dependensi state berubah.
 * - raa-http:lazy      : GET hanya dijalankan jika dipicu manual (tidak otomatis).
 * - raa-http:confirm   : Minta konfirmasi sebelum eksekusi request.
 * - raa-http:poll="ms" : Polling berkala dengan interval milidetik.
 * - raa-http:debounce  : Tunda eksekusi N ms setelah pemicu terakhir.
 * - raa-http:throttle  : Batasi frekuensi eksekusi menjadi maksimal 1 per N ms.
 * - raa-http:headers   : JSON header tambahan untuk request.
 * - raa-http:query     : JSON query string tambahan.
 * - raa-http:body      : JSON body override untuk POST/PUT/PATCH.
 * - raa-http:response  : Tipe respons (json | text | blob | formData | arrayBuffer).
 * - raa-on:http:success|error|finally|abort : Handler hasil request.
 * - $http              : Proxy state dengan status loading/error/data per request-key.
 * - window.RaaHttp     : API global untuk interceptors dan request manual.
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Abort-Safe (Automatic Cleanup), Interceptor Pipeline,
 *   Reactive-Friendly, Scope-Aware, CSP-Safe, Plugin-Native (v3.1.0+).
 *
 * "Kebenaran data adalah jembatan kepercayaan antara Client dan Server."
 * ───────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.1.0 (2026-05-23)
 *   [BREAKING]  Monkey-patch pada Raa.createBindingEffect (tidak ada di v3.1.0),
 *               Raa.compileRoot, dan Raa.destroyRoot diganti sepenuhnya.
 *   [FEATURE]   raa-http:* terdaftar sebagai custom directive via Plugin System.
 *               Handler directive menangani raa-http:get|post|put|patch|delete.
 *               Modifier directives (reactive, lazy, debounce, dll) dibaca
 *               via getAttribute() di dalam handler utama — tidak perlu efek sendiri.
 *   [FEATURE]   $http diinjeksikan ke state via afterCompile hook (bukan compileRoot patch).
 *   [FIX]       Cleanup poller dan pembatalan request via beforeDestroy hook.
 *   [FIX]       console.log production leak dihapus.
 *   [IMPROVE]   Directive handler bisa mengakses raa.createEffect() via closure,
 *               dan effect dipush ke el.__raa_effects__ agar auto-cleanup oleh core.
 *
 * v2.2.0 (baseline)
 *   Original version — createBindingEffect monkey-patching approach.
 * ───────────────────────────────────────────────────────────
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  DEFAULT CONFIG
  // ═══════════════════════════════════════════════════════
  const DEFAULTS = {
    baseURL: '',
    headers: {},
    timeout: 0,
    credentials: 'same-origin',
    responseType: 'json',
    autoParse: true
  };

  // ═══════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════
  function serializeQuery(obj) {
    if (!obj) return '';
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, v);
    });
    const str = params.toString();
    return str ? '?' + str : '';
  }

  function createError(type, status, statusText, url, method, body, raw) {
    return {
      ok: false, type,
      status: status || 0,
      statusText: statusText || '',
      message: `Request ${method || 'GET'} ${url || ''} failed`,
      url: url || '', method: method || 'GET',
      body: body || null, raw: raw || null
    };
  }

  // ═══════════════════════════════════════════════════════
  //  INTERCEPTOR PIPELINE
  // ═══════════════════════════════════════════════════════
  const interceptors = { request: [], response: [], error: [] };

  async function applyRequestInterceptors(config) {
    let result = config;
    for (const fn of interceptors.request) result = await fn(result);
    return result;
  }

  async function applyResponseInterceptors(response) {
    let result = response;
    for (const fn of interceptors.response) result = await fn(result);
    return result;
  }

  async function applyErrorInterceptors(error) {
    let result = error;
    for (const fn of interceptors.error) result = await fn(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════
  //  REQUEST ENGINE
  // ═══════════════════════════════════════════════════════
  async function executeRequest(config, externalController) {
    config = await applyRequestInterceptors({ ...DEFAULTS, ...config });

    const {
      method = 'GET', url, baseURL = '',
      headers = {}, query, body,
      timeout = 0, credentials = 'same-origin',
      responseType = 'json', autoParse = true
    } = config;

    let fullUrl = baseURL + url;
    if (query && Object.keys(query).length) fullUrl += serializeQuery(query);

    const controller = externalController || new AbortController();
    let timeoutId;
    if (timeout > 0) timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      method,
      headers: { ...headers },
      credentials,
      signal: controller.signal
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      if (body instanceof FormData) {
        fetchOptions.body = body;
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
        if (!fetchOptions.headers['Content-Type']) fetchOptions.headers['Content-Type'] = 'text/plain';
      } else {
        fetchOptions.body = JSON.stringify(body);
        if (!fetchOptions.headers['Content-Type']) fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      let data = null;
      if (autoParse && responseType === 'json') {
        const text = await response.text();
        try { data = JSON.parse(text); } catch { data = text; }
      } else if (responseType === 'text')        { data = await response.text(); }
      else if (responseType === 'blob')          { data = await response.blob(); }
      else if (responseType === 'formData')      { data = await response.formData(); }
      else if (responseType === 'arrayBuffer')   { data = await response.arrayBuffer(); }

      return await applyResponseInterceptors({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        headers: response.headers,
        data,
        raw: response
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const errorType = err.name === 'AbortError'
        ? (timeout > 0 && controller.signal.aborted ? 'timeout' : 'abort')
        : 'network';
      return await applyErrorInterceptors(createError(errorType, 0, err.message, fullUrl, method, body, null));
    }
  }

  // ═══════════════════════════════════════════════════════
  //  REQUEST REGISTRY & SCOPE
  // ═══════════════════════════════════════════════════════
  const requestRegistry = new WeakMap(); // root → Map(key → requestState)

  function getRequestMap(root) {
    if (!requestRegistry.has(root)) requestRegistry.set(root, new Map());
    return requestRegistry.get(root);
  }

  function createRequestState() {
    return {
      loading: false, success: false,
      error: null, status: null,
      data: null, response: null,
      aborted: false, finished: false,
      controller: null,
      cancel() { if (this.controller) { this.controller.abort(); this.aborted = true; } }
    };
  }

  function getRequestState(root, key) {
    const map = getRequestMap(root);
    if (!map.has(key)) map.set(key, createRequestState());
    return map.get(key);
  }

  function cancelAllRequests(root) {
    const map = getRequestMap(root);
    map.forEach(state => state.cancel());
    map.clear();
  }

  // ═══════════════════════════════════════════════════════
  //  GLOBAL API: window.RaaHttp
  // ═══════════════════════════════════════════════════════
  class RaaHttpClient {
    constructor(config) { this.config = { ...DEFAULTS, ...config }; }
    request(config) { return executeRequest({ ...this.config, ...config }); }
    get(url, opts = {}) { return this.request({ ...opts, method: 'GET', url }); }
    post(url, body, opts = {}) { return this.request({ ...opts, method: 'POST', url, body }); }
    put(url, body, opts = {}) { return this.request({ ...opts, method: 'PUT', url, body }); }
    patch(url, body, opts = {}) { return this.request({ ...opts, method: 'PATCH', url, body }); }
    delete(url, opts = {}) { return this.request({ ...opts, method: 'DELETE', url }); }
  }

  window.RaaHttp = {
    interceptors,
    defaults: { ...DEFAULTS },
    request(config) { return executeRequest(config); },
    get(url, opts = {}) { return executeRequest({ ...opts, method: 'GET', url }); },
    post(url, body, opts = {}) { return executeRequest({ ...opts, method: 'POST', url, body }); },
    put(url, body, opts = {}) { return executeRequest({ ...opts, method: 'PUT', url, body }); },
    patch(url, body, opts = {}) { return executeRequest({ ...opts, method: 'PATCH', url, body }); },
    delete(url, opts = {}) { return executeRequest({ ...opts, method: 'DELETE', url }); },
    createClient(config = {}) { return new RaaHttpClient(config); },
    cancel(key, root) { if (root) { const s = getRequestMap(root).get(key); if (s) s.cancel(); } },
    cancelAll(root) { if (root) cancelAllRequests(root); },
    serializeQuery,
    createError
  };

  // ═══════════════════════════════════════════════════════
  //  DIRECTIVE HANDLER BUILDER
  //  Digunakan untuk membangun handler raa-http:get|post|put|patch|delete
  // ═══════════════════════════════════════════════════════
  function buildHttpDirectiveHandler(raa) {
    return function handleHttpDirective(el, name, value, state, root) {
      // Hanya tangani method directives — modifier directives diabaikan (dibaca via getAttribute)
      const methodMatch = name.match(/^raa-http:(get|post|put|patch|delete)$/i);
      if (!methodMatch) return;

      const method = methodMatch[1].toUpperCase();

      // Sintaks: "urlExpression -> stateKey"
      const arrowIdx = value.lastIndexOf('->');
      if (arrowIdx === -1) {
        console.warn(`[RaaHttp] Sintaks salah pada "${name}". Gunakan: "urlExpr -> stateKey"`);
        return;
      }
      const urlExpr = value.substring(0, arrowIdx).trim();
      const target = value.substring(arrowIdx + 2).trim();
      if (!target) return;

      // Baca modifier directives dari elemen
      const reactive    = el.hasAttribute('raa-http:reactive');
      const lazy        = el.hasAttribute('raa-http:lazy');
      const debounce    = parseInt(el.getAttribute('raa-http:debounce'))  || 0;
      const throttle    = parseInt(el.getAttribute('raa-http:throttle'))  || 0;
      const poll        = parseInt(el.getAttribute('raa-http:poll'))      || 0;
      const timeout     = parseInt(el.getAttribute('raa-http:timeout'))   || 0;
      const responseType= el.getAttribute('raa-http:response')      || undefined;
      const credentials = el.getAttribute('raa-http:credentials')   || undefined;
      const confirmMsg  = el.getAttribute('raa-http:confirm');

      let extraHeaders = {}, extraQuery = {}, extraBody = null;
      try {
        const h = el.getAttribute('raa-http:headers'); if (h) extraHeaders = JSON.parse(h);
        const q = el.getAttribute('raa-http:query');   if (q) extraQuery   = JSON.parse(q);
        const b = el.getAttribute('raa-http:body');    if (b) extraBody    = JSON.parse(b);
      } catch (e) {
        console.warn('[RaaHttp] JSON tidak valid di headers/query/body:', e);
      }

      const isForm = (method === 'POST' || method === 'PUT' || method === 'PATCH') && el.tagName === 'FORM';

      // ── Fungsi utama eksekusi request ────────────────────────────────────
      const doRequest = async () => {
        if (confirmMsg && !confirm(confirmMsg)) return;

        const url = raa.evaluate(urlExpr, state, el);
        if (!url) return;

        const reqState = getRequestState(root, target);
        if (reqState.controller) reqState.controller.abort();
        const controller = new AbortController();
        reqState.controller = controller;
        Object.assign(reqState, { loading: true, success: false, error: null, aborted: false, finished: false });

        const config = {
          method, url,
          headers: extraHeaders, query: extraQuery,
          body: extraBody, timeout, responseType, credentials
        };
        if (isForm && !extraBody) config.body = new FormData(el);

        try {
          const response = await executeRequest(config, controller);
          if (reqState.controller !== controller) return;

          if (response.ok) {
            state[target] = response.data;
            Object.assign(reqState, { loading: false, success: true, data: response.data, response, status: response.status, finished: true });
            const onSuccess = el.getAttribute('raa-on:http:success');
            if (onSuccess) raa.evaluate(onSuccess, state, el, { $event: response });
          } else {
            Object.assign(reqState, { loading: false, error: response, status: response.status || 0, finished: true });
            const onError = el.getAttribute('raa-on:http:error');
            if (onError) raa.evaluate(onError, state, el, { $event: response });
          }
        } catch (err) {
          if (reqState.controller !== controller) return;
          Object.assign(reqState, { loading: false, error: err, finished: true });
          const onError = el.getAttribute('raa-on:http:error');
          if (onError) raa.evaluate(onError, state, el, { $event: err });
        } finally {
          if (reqState.controller === controller) {
            const onFinally = el.getAttribute('raa-on:http:finally');
            if (onFinally) raa.evaluate(onFinally, state, el);
          }
        }
      };

      // ── Debounce/throttle wrapper ────────────────────────────────────────
      let debounceTimer, lastThrottle = 0;
      const run = () => {
        if (debounce > 0) { clearTimeout(debounceTimer); debounceTimer = setTimeout(doRequest, debounce); return; }
        if (throttle > 0) { const now = Date.now(); if (now - lastThrottle < throttle) return; lastThrottle = now; }
        doRequest();
      };

      // ── Reactive effect (GET auto-run / reactive) ───────────────────────
      const effectFn = () => {
        if (method === 'GET' && (reactive || !lazy)) run();
      };

      if (!el.__raa_effects__) el.__raa_effects__ = [];
      el.__raa_effects__.push(raa.createEffect(effectFn, { root, element: el }));

      // ── Event listener untuk form submit atau non-GET click ──────────────
      if (isForm) {
        el.addEventListener('submit', (e) => { e.preventDefault(); run(); });
      } else if (method !== 'GET' && !lazy) {
        el.addEventListener('click', (e) => { e.preventDefault(); run(); });
      }

      // ── Polling ─────────────────────────────────────────────────────────
      if (poll > 0) {
        const poller = setInterval(() => { if (!el.isConnected) { clearInterval(poller); return; } run(); }, poll);
        if (!root.__raa_http_pollers__) root.__raa_http_pollers__ = new Map();
        root.__raa_http_pollers__.set(el, poller);
      }
    };
  }

  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.1.0 Plugin System)
  // ═══════════════════════════════════════════════════════
  const RaaHttpPlugin = {
    name: 'raa-http',

    install(raa) {
      // ── 1. Daftarkan custom directive raa-http:* ─────────────────────────
      // Handler utama menangani method directives (get|post|put|patch|delete).
      // Modifier directives (reactive, lazy, debounce, dll) dikembalikan no-op
      // karena dibaca via getAttribute() di dalam handler method.
      raa.__raa_custom_directives__.push([
        'raa-http:*',
        buildHttpDirectiveHandler(raa)
      ]);

      // ── 2. afterCompile: injeksikan $http ke state ───────────────────────
      raa.pluginManager.addHook('afterCompile', function (root, state) {
        if (!state || state.$http) return;
        Object.defineProperty(state, '$http', {
          enumerable: true,
          configurable: true,
          get() {
            return new Proxy({}, {
              get(_, key) { return getRequestState(root, key); },
              set(_, key, value) {
                Object.assign(getRequestState(root, key), value);
                return true;
              }
            });
          }
        });
      }, 'raa-http');

      // ── 3. beforeDestroy: hentikan poller & batalkan semua request ───────
      raa.pluginManager.addHook('beforeDestroy', function (root) {
        if (root.__raa_http_pollers__) {
          root.__raa_http_pollers__.forEach(poller => clearInterval(poller));
          root.__raa_http_pollers__ = null;
        }
        cancelAllRequests(root);
        requestRegistry.delete(root);
      }, 'raa-http');
    },

    uninstall(raa) {}
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  // ═══════════════════════════════════════════════════════
  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaHttp] window.Raa tidak ditemukan. Muat raa-v3.1.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaHttpPlugin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
