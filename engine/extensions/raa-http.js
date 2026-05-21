/**
 * RaaJS HTTP Client Extension | v2.2.0
 * File: raa-http.js
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Kurir Jujur" (Honest Courier). Ekstensi ini adalah 
 * jembatan komunikasi antara aplikasi dan dunia luar (Server), 
 * yang bertugas membawa data masuk ke dalam state secara reaktif 
 * dengan manajemen siklus request yang sangat disiplin.
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-http:[get|post|put|patch|delete] : Melakukan request langsung dari elemen.
 * - raa-http:reactive/lazy/confirm : Kendali pemicu & konfirmasi interaksi.
 * - raa-http:poll/debounce/throttle : Manajemen waktu dan kecepatan request.
 * - raa-http:headers/query/body : Injeksi muatan data & metadata request.
 * - raa-on:http:[success|error|finally|abort] : Handler hasil perjalanan kurir.
 * - $http (Proxy State) : Akses reaktif ke status loading, error, dan data.
 * - window.RaaHttp : API global untuk interceptors dan kontrol manual.
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Abort-Safe (Automatic Cleanup), Interceptor Pipeline, 
 *   Reactive-Friendly, Scope-Aware, CSP-Safe.
 * 
 * "Kebenaran data adalah jembatan kepercayaan antara Client dan Server."
 * ───────────────────────────────────────────────────────────
 */

(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaHttp] RaaJS not found. Load raa.js first.');
    return;
  }

  // ═══════════════════════════════════════════════════
  //  DEFAULT CONFIG
  // ═══════════════════════════════════════════════════
  const DEFAULTS = {
    baseURL: '',
    headers: {},
    timeout: 0,
    credentials: 'same-origin',
    responseType: 'json',
    autoParse: true
  };

  // ═══════════════════════════════════════════════════
  //  UTILITY: serialize query object
  // ═══════════════════════════════════════════════════
  function serializeQuery(obj) {
    if (!obj) return '';
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, v);
    });
    const str = params.toString();
    return str ? '?' + str : '';
  }

  // ═══════════════════════════════════════════════════
  //  UTILITY: create error object
  // ═══════════════════════════════════════════════════
  function createError(type, status, statusText, url, method, body, raw) {
    return {
      ok: false,
      type,
      status: status || 0,
      statusText: statusText || '',
      message: `Request ${method || 'GET'} ${url || ''} failed`,
      url: url || '',
      method: method || 'GET',
      body: body || null,
      raw: raw || null
    };
  }

  // ═══════════════════════════════════════════════════
  //  INTERCEPTOR PIPELINE
  // ═══════════════════════════════════════════════════
  const interceptors = {
    request: [],
    response: [],
    error: []
  };

  async function applyRequestInterceptors(config) {
    let result = config;
    for (const fn of interceptors.request) {
      result = await fn(result);
    }
    return result;
  }

  async function applyResponseInterceptors(response) {
    let result = response;
    for (const fn of interceptors.response) {
      result = await fn(result);
    }
    return result;
  }

  async function applyErrorInterceptors(error) {
    let result = error;
    for (const fn of interceptors.error) {
      result = await fn(result);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════
  //  REQUEST ENGINE (dengan eksternal AbortController)
  // ═══════════════════════════════════════════════════
  async function executeRequest(config, externalController) {
    // Apply request interceptors
    config = await applyRequestInterceptors({ ...DEFAULTS, ...config });

    const {
      method = 'GET',
      url,
      baseURL = '',
      headers = {},
      query,
      body,
      timeout = 0,
      credentials = 'same-origin',
      responseType = 'json',
      autoParse = true,
      signal // bisa dari luar (eksternal) atau kita buat
    } = config;

    // Build full URL
    let fullUrl = baseURL + url;
    if (query && Object.keys(query).length) {
      fullUrl += serializeQuery(query);
    }

    // Abort controller: pakai eksternal jika ada, jika tidak buat internal (untuk timeout)
    const controller = externalController || new AbortController();
    const fetchSignal = controller.signal;

    // Gabungkan sinyal eksternal jika ada (tapi di sini kita sudah pakai controller yang sama)
    // Timeout menggunakan controller yang sama
    let timeoutId;
    if (timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    // Build fetch options
    const fetchOptions = {
      method,
      headers: { ...headers },
      credentials,
      signal: fetchSignal
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      if (body instanceof FormData) {
        fetchOptions.body = body;
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
        if (!fetchOptions.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'text/plain';
        }
      } else {
        fetchOptions.body = JSON.stringify(body);
        if (!fetchOptions.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const ok = response.ok;
      const status = response.status;
      const statusText = response.statusText;
      const raw = response;

      let data = null;
      if (autoParse && responseType === 'json') {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      } else if (responseType === 'text') {
        data = await response.text();
      } else if (responseType === 'blob') {
        data = await response.blob();
      } else if (responseType === 'formData') {
        data = await response.formData();
      } else if (responseType === 'arrayBuffer') {
        data = await response.arrayBuffer();
      }

      const responseObj = {
        ok,
        status,
        statusText,
        url: fullUrl,
        headers: response.headers,
        data,
        raw
      };

      return await applyResponseInterceptors(responseObj);
    } catch (err) {
      clearTimeout(timeoutId);
      let errorType = 'network';
      if (err.name === 'AbortError') {
        // Jika controller kita yang abort, periksa apakah karena timeout atau manual
        errorType = timeout > 0 && controller.signal.aborted ? 'timeout' : 'abort';
      }
      const errorObj = createError(errorType, 0, err.message, fullUrl, method, body, null);
      return await applyErrorInterceptors(errorObj);
    }
  }

  // ═══════════════════════════════════════════════════
  //  REQUEST REGISTRY & SCOPE MANAGEMENT
  // ═══════════════════════════════════════════════════
  const requestRegistry = new WeakMap(); // root → Map(key → request state)

  function getRequestMap(root) {
    if (!requestRegistry.has(root)) {
      requestRegistry.set(root, new Map());
    }
    return requestRegistry.get(root);
  }

  function createRequestState() {
    return {
      loading: false,
      success: false,
      error: null,
      status: null,
      data: null,
      response: null,
      aborted: false,
      finished: false,
      controller: null,
      cancel() {
        if (this.controller) {
          this.controller.abort();
          this.aborted = true;
        }
      }
    };
  }

  function getRequestState(root, key) {
    const map = getRequestMap(root);
    if (!map.has(key)) {
      map.set(key, createRequestState());
    }
    return map.get(key);
  }

  function deleteRequestState(root, key) {
    const map = getRequestMap(root);
    if (map.has(key)) {
      map.get(key).cancel();
      map.delete(key);
    }
  }

  function cancelAllRequests(root) {
    const map = getRequestMap(root);
    map.forEach((state, key) => {
      state.cancel();
    });
    map.clear();
  }

  // ═══════════════════════════════════════════════════
  //  GLOBAL API
  // ═══════════════════════════════════════════════════
  const RaaHttp = {
    interceptors,
    defaults: { ...DEFAULTS },

    request(config) {
      return executeRequest(config);
    },

    get(url, options = {}) {
      return executeRequest({ ...options, method: 'GET', url });
    },
    post(url, body, options = {}) {
      return executeRequest({ ...options, method: 'POST', url, body });
    },
    put(url, body, options = {}) {
      return executeRequest({ ...options, method: 'PUT', url, body });
    },
    patch(url, body, options = {}) {
      return executeRequest({ ...options, method: 'PATCH', url, body });
    },
    delete(url, options = {}) {
      return executeRequest({ ...options, method: 'DELETE', url });
    },

    createClient(config = {}) {
      return new RaaHttpClient(config);
    },

    cancel(key, root) {
      if (root) deleteRequestState(root, key);
    },

    cancelAll(root) {
      if (root) cancelAllRequests(root);
    },

    serializeQuery,
    createError
  };

  window.RaaHttp = RaaHttp;

  // ═══════════════════════════════════════════════════
  //  CLIENT INSTANCE
  // ═══════════════════════════════════════════════════
  class RaaHttpClient {
    constructor(config) {
      this.config = { ...DEFAULTS, ...config };
    }

    request(config) {
      return executeRequest({ ...this.config, ...config });
    }
    get(url, options = {}) {
      return this.request({ ...options, method: 'GET', url });
    }
    post(url, body, options = {}) {
      return this.request({ ...options, method: 'POST', url, body });
    }
    put(url, body, options = {}) {
      return this.request({ ...options, method: 'PUT', url, body });
    }
    patch(url, body, options = {}) {
      return this.request({ ...options, method: 'PATCH', url, body });
    }
    delete(url, options = {}) {
      return this.request({ ...options, method: 'DELETE', url });
    }
  }

  // ═══════════════════════════════════════════════════
  //  INTEGRATION WITH RaaJS
  // ═══════════════════════════════════════════════════
  const Raa = window.Raa;

  // Override compileRoot untuk membuat $http yang benar-benar terhubung
  const originalCompileRoot = Raa.compileRoot.bind(Raa);
  Raa.compileRoot = function (root) {
    const state = originalCompileRoot(root);
    if (!state) return state;

    // Buat properti $http yang langsung mengacu ke registry root ini
    Object.defineProperty(state, '$http', {
      get: () => {
        // Kembalikan objek dengan akses langsung ke request state
        const map = getRequestMap(root);
        return new Proxy({}, {
          get(_, key) {
            return getRequestState(root, key);
          },
          set(_, key, value) {
            // Jika seseorang melakukan assignment (tidak disarankan), tetap update registry
            const current = getRequestState(root, key);
            Object.assign(current, value);
            return true;
          }
        });
      },
      enumerable: true,
      configurable: true
    });

    return state;
  };

  // Override createBindingEffect untuk directive HTTP
  const originalCreateBindingEffect = Raa.createBindingEffect.bind(Raa);

  Raa.createBindingEffect = function (el, name, value, state, root) {
    const httpMatch = name.match(/^raa-http:(get|post|put|patch|delete)$/);
    if (httpMatch) {
      const method = httpMatch[1].toUpperCase();
      const arrowIdx = value.lastIndexOf('->');
      if (arrowIdx === -1) return;
      const urlExpr = value.substring(0, arrowIdx).trim();
      const target = value.substring(arrowIdx + 2).trim();
      if (!target) return;

      // Modifier directives
      const reactive = el.hasAttribute('raa-http:reactive');
      const lazy = el.hasAttribute('raa-http:lazy');
      const debounce = parseInt(el.getAttribute('raa-http:debounce')) || 0;
      const throttle = parseInt(el.getAttribute('raa-http:throttle')) || 0;
      const poll = parseInt(el.getAttribute('raa-http:poll')) || 0;
      const timeout = parseInt(el.getAttribute('raa-http:timeout')) || 0;
      const responseType = el.getAttribute('raa-http:response') || undefined;
      const credentials = el.getAttribute('raa-http:credentials') || undefined;
      const confirmMsg = el.getAttribute('raa-http:confirm');

      let extraHeaders = {};
      let extraQuery = {};
      let extraBody = null;
      try {
        const h = el.getAttribute('raa-http:headers');
        if (h) extraHeaders = JSON.parse(h);
        const q = el.getAttribute('raa-http:query');
        if (q) extraQuery = JSON.parse(q);
        const b = el.getAttribute('raa-http:body');
        if (b) extraBody = JSON.parse(b);
      } catch (e) {
        console.warn('[RaaHttp] Invalid JSON in headers/query/body', e);
      }

      const isForm = (method === 'POST' || method === 'PUT' || method === 'PATCH') && el.tagName === 'FORM';

      // Fungsi utama eksekusi request
      const doRequest = async () => {
        if (confirmMsg && !confirm(confirmMsg)) return;

        const url = Raa.evaluate(urlExpr, state, el);
        if (!url) return;

        // Ambil request state dari registry, update dan set controller baru
        const reqState = getRequestState(root, target);
        // Batalkan request sebelumnya jika masih berjalan (untuk reactive atau double submit)
        if (reqState.controller) {
          reqState.controller.abort();
        }
        const controller = new AbortController();
        reqState.controller = controller;
        Object.assign(reqState, {
          loading: true,
          success: false,
          error: null,
          aborted: false,
          finished: false
        });

        // Sinkronkan ke state.$http (properti ini sekarang otomatis membaca registry)
        // Tidak perlu assignment manual, karena state.$http[target] langsung mengakses getRequestState

        const config = {
          method,
          url,
          headers: extraHeaders,
          query: extraQuery,
          body: extraBody,
          timeout,
          responseType,
          credentials,
          scope: root
        };

        if (isForm && !extraBody) {
          config.body = new FormData(el);
        }

        try {
          // Panggil executeRequest dengan controller yang sama
          const response = await executeRequest(config, controller);
          // Setelah selesai, periksa apakah controller masih sama (hindari race condition)
          if (reqState.controller !== controller) return;

          if (response.ok) {
            state[target] = response.data;
            Object.assign(reqState, {
              loading: false,
              success: true,
              data: response.data,
              response,
              status: response.status,
              finished: true
            });
            const onSuccess = el.getAttribute('raa-on:http:success');
            if (onSuccess) Raa.evaluate(onSuccess, state, el, { $event: response });
          } else {
            Object.assign(reqState, {
              loading: false,
              error: response,
              status: response.status || 0,
              finished: true
            });
            const onError = el.getAttribute('raa-on:http:error');
            if (onError) Raa.evaluate(onError, state, el, { $event: response });
          }
        } catch (err) {
          if (reqState.controller !== controller) return;
          Object.assign(reqState, {
            loading: false,
            error: err,
            finished: true
          });
          const onError = el.getAttribute('raa-on:http:error');
          if (onError) Raa.evaluate(onError, state, el, { $event: err });
        } finally {
          if (reqState.controller === controller) {
            const onFinally = el.getAttribute('raa-on:http:finally');
            if (onFinally) Raa.evaluate(onFinally, state, el);
          }
        }
      };

      // Debounce/throttle wrapper
      let debounceTimer;
      let lastThrottle = 0;
      const runWithModifiers = () => {
        if (debounce > 0) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(doRequest, debounce);
          return;
        }
        if (throttle > 0) {
          const now = Date.now();
          if (now - lastThrottle < throttle) return;
          lastThrottle = now;
        }
        doRequest();
      };

      // Efek utama
      const effectFn = () => {
        if (reactive) {
          // Reactive hanya untuk GET (sesuai kontrak)
          if (method === 'GET') runWithModifiers();
        } else if (!lazy) {
          if (method === 'GET') runWithModifiers();
        }
      };

      el.__raa_effects__.push(this.createEffect(effectFn, { root, element: el }));

      // Event untuk non-GET
      if (isForm) {
        el.addEventListener('submit', (e) => {
          e.preventDefault();
          runWithModifiers();
        });
      } else if (method !== 'GET' && !lazy) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          runWithModifiers();
        });
      }

      // Polling
      if (poll > 0) {
        const poller = setInterval(() => {
          if (!el.isConnected) {
            clearInterval(poller);
            return;
          }
          runWithModifiers();
        }, poll);
        if (!root.__raa_http_pollers__) root.__raa_http_pollers__ = new Map();
        root.__raa_http_pollers__.set(el, poller);
      }

      return;
    }

    // Fallback
    return originalCreateBindingEffect(el, name, value, state, root);
  };

  // Override destroyRoot untuk cleanup
  const originalDestroyRoot = Raa.destroyRoot.bind(Raa);
  Raa.destroyRoot = function (root) {
    // Bersihkan poller
    if (root.__raa_http_pollers__) {
      root.__raa_http_pollers__.forEach(poller => clearInterval(poller));
      root.__raa_http_pollers__ = null;
    }
    // Batalkan semua request yang terdaftar
    cancelAllRequests(root);
    requestRegistry.delete(root);
    originalDestroyRoot(root);
  };

  console.log('[RaaHttp] v1.0 production ready. Methods: GET, POST, PUT, PATCH, DELETE');
})();