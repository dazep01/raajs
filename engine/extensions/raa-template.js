/**
 * RaaJS Template Extension | v3.1.0
 * File: raa-template.js
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Arsitek Modular" (Blueprint Architect). Ekstensi ini
 * adalah sistem cetak biru yang memungkinkan komponen HTML dibuat
 * sekali dan digunakan berkali-kali tanpa kehilangan jiwa
 * reaktifnya, menciptakan struktur yang rapi dan terorganisir.
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-template:define : Mendefinisikan cetak biru (blueprint) komponen.
 * - raa-template:use    : Memanggil dan merender instansi komponen ke DOM.
 * - raa-template:data   : Menyuntikkan state lokal (data) khusus untuk instansi.
 * - <slot name="...">   : Lubang konten dinamis (Named & Default) dengan fallback.
 * - window.RaaTemplate  : API kontrol manual untuk registrasi template via JS.
 * ───────────────────────────────────────────────────────────
 * ✨ FITUR
 * - Template reusable deklaratif
 * - State lokal per instance (island-scoped)
 * - Slot dengan fallback content
 * - Reaktif penuh dalam template
 * - CSP-safe, no eval
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Declarative Reusable, Island-Scoped State, Fallback Content,
 *   Full Reactive, CSP-Safe (No-Eval), Plugin-Native (v3.1.0+).
 *
 * "Membangun sekali, menginspirasi berkali-kali."
 * ───────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.1.0 (2026-05-23)
 *   [BREAKING]  Monkey-patch pada Raa.compileRoot dan Raa.destroyRoot
 *               diganti dengan Plugin System v3.1.0.
 *   [FIX]       captureDefines sekarang berjalan via wrap instance raa.compileRoot()
 *               di dalam install(raa) — diperlukan karena define harus dijalankan
 *               SEBELUM core memproses subtree (tidak ada beforeCompile hook).
 *   [FIX]       processUses sekarang berjalan via afterCompile hook — lebih bersih
 *               dan tidak berisiko double-call.
 *   [FIX]       Cleanup flag raa-template:use via beforeDestroy hook.
 *   [FIX]       console.log production leak dihapus.
 *   [IMPROVE]   raa-template:define dan raa-template:use terdaftar sebagai
 *               custom directive (no-op handler) agar core tidak memunculkan
 *               warning "unknown directive".
 *
 * v2.2.0 (baseline)
 *   Original version — monkey-patching approach.
 * ───────────────────────────────────────────────────────────
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  TEMPLATE REGISTRY
  // ═══════════════════════════════════════════════════════
  const templateRegistry = new Map(); // name → DocumentFragment

  // ═══════════════════════════════════════════════════════
  //  CORE FUNCTIONS
  // ═══════════════════════════════════════════════════════

  /**
   * Pindai root dan simpan semua raa-template:define ke registry.
   * Elemen define dihapus dari DOM agar tidak terproses oleh core.
   * @param {HTMLElement} root
   */
  function captureDefines(root) {
    root.querySelectorAll('[raa-template\\:define]').forEach(el => {
      const name = el.getAttribute('raa-template:define');
      if (!name) { el.remove(); return; }

      // Tidak daftarkan ulang template yang sudah ada (kecuali ada override)
      if (!templateRegistry.has(name)) {
        let content;
        if (el.tagName === 'TEMPLATE') {
          content = el.content.cloneNode(true);
        } else {
          const frag = document.createDocumentFragment();
          while (el.firstChild) frag.appendChild(el.firstChild);
          content = frag;
        }
        templateRegistry.set(name, content);
      }
      el.remove();
    });
  }

  /**
   * Proses semua raa-template:use di dalam root:
   * clone template, isi slot, buat wrapper island, compile sebagai root baru.
   * @param {HTMLElement} root
   * @param {object} state
   * @param {RaaJS} raa
   */
  function processUses(root, state, raa) {
    root.querySelectorAll('[raa-template\\:use]').forEach(el => {
      if (el.__raa_template_processed__) return;
      el.__raa_template_processed__ = true;

      const templateName = el.getAttribute('raa-template:use');
      if (!templateName) return;

      const templateContent = templateRegistry.get(templateName);
      if (!templateContent) {
        console.warn(`[RaaTemplate] Template "${templateName}" tidak ditemukan.`);
        return;
      }

      // Clone template content
      const clone = templateContent.cloneNode(true);

      // Proses slot
      processSlots(clone, el);

      // Data lokal untuk instance (opsional)
      let instanceData = {};
      const dataExpr = el.getAttribute('raa-template:data');
      if (dataExpr) {
        try { instanceData = raa.evaluate(dataExpr, state, el); }
        catch (e) { console.warn('[RaaTemplate] Ekspresi data tidak valid:', dataExpr, e); }
      }

      // Buat wrapper island untuk scoped state
      const wrapper = document.createElement('div');
      wrapper.setAttribute('raa-eco:island', '');
      if (Object.keys(instanceData).length) {
        wrapper.setAttribute('raa-core:data', JSON.stringify(instanceData));
      }
      wrapper.style.display = 'contents'; // transparan terhadap layout

      while (clone.firstChild) wrapper.appendChild(clone.firstChild);
      el.parentNode.replaceChild(wrapper, el);

      // Kompilasi wrapper sebagai root baru (island) setelah microtask
      queueMicrotask(() => { raa.compileRoot(wrapper); });
    });
  }

  /**
   * Ganti elemen <slot> di dalam clone dengan konten dari elemen use.
   * @param {DocumentFragment} clone
   * @param {HTMLElement} useEl
   */
  function processSlots(clone, useEl) {
    const slotContents = new Map();
    const defaultSlotContent = document.createDocumentFragment();

    Array.from(useEl.childNodes).forEach(child => {
      if (child.nodeType === 1 && child.hasAttribute('slot')) {
        const slotName = child.getAttribute('slot');
        if (!slotContents.has(slotName)) slotContents.set(slotName, document.createDocumentFragment());
        slotContents.get(slotName).appendChild(child);
      } else {
        defaultSlotContent.appendChild(child);
      }
    });

    if (defaultSlotContent.childNodes.length) {
      slotContents.set('default', defaultSlotContent);
    }

    clone.querySelectorAll('slot').forEach(slotEl => {
      const slotName = slotEl.getAttribute('name') || 'default';
      const content = slotContents.get(slotName);

      if (content && content.childNodes.length) {
        slotEl.parentNode.replaceChild(content.cloneNode(true), slotEl);
      } else if (slotEl.childNodes.length) {
        // Gunakan fallback content dari dalam slot itu sendiri
        const fallback = document.createDocumentFragment();
        while (slotEl.firstChild) fallback.appendChild(slotEl.firstChild);
        slotEl.parentNode.replaceChild(fallback, slotEl);
      } else {
        slotEl.parentNode.removeChild(slotEl);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  //  GLOBAL API: window.RaaTemplate
  // ═══════════════════════════════════════════════════════
  window.RaaTemplate = {
    /**
     * Daftarkan template secara manual via JS.
     * @param {string}          name
     * @param {string|Element}  html - string HTML atau elemen <template>
     */
    define(name, html) {
      let content;
      if (typeof html === 'string') {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        content = tpl.content.cloneNode(true);
      } else if (html instanceof Element) {
        content = html.content ? html.content.cloneNode(true) : html.cloneNode(true);
      } else {
        return;
      }
      templateRegistry.set(name, content);
    },

    /** Cek apakah template sudah terdaftar */
    has(name) { return templateRegistry.has(name); },

    /** Hapus template dari registry */
    remove(name) { templateRegistry.delete(name); },

    /** Dapatkan konten template (untuk debugging) */
    get(name) { return templateRegistry.get(name) || null; }
  };

  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.1.0 Plugin System)
  // ═══════════════════════════════════════════════════════
  const RaaTemplatePlugin = {
    name: 'raa-template',

    install(raa) {
      // ── 1. Daftarkan custom directives agar core tidak memunculkan warning ─
      // raa-template:define → dihapus dari DOM via captureDefines sebelum compile
      // raa-template:use    → diproses oleh processUses via afterCompile
      // raa-template:data   → dibaca sebagai atribut oleh processUses
      raa.__raa_custom_directives__.push(['raa-template:*', function() { /* no-op */ }]);

      // ── 2. Wrap raa.compileRoot untuk menjalankan captureDefines SEBELUM core ─
      // Tidak ada beforeCompile hook di v3.1.0, sehingga kita wrap instance method.
      // captureDefines harus berjalan sebelum core memproses binding agar elemen
      // <template raa-template:define> sudah dihapus dari DOM sebelum diproses.
      const origCompileRoot = raa.compileRoot.bind(raa);
      raa.compileRoot = function (root) {
        captureDefines(root);
        return origCompileRoot(root);
      };

      // ── 3. afterCompile: proses semua raa-template:use ───────────────────
      raa.pluginManager.addHook('afterCompile', function (root, state) {
        processUses(root, state, raa);
      }, 'raa-template');

      // ── 4. beforeDestroy: reset flag ─────────────────────────────────────
      raa.pluginManager.addHook('beforeDestroy', function (root) {
        root.querySelectorAll('[raa-template\\:use]').forEach(el => {
          el.__raa_template_processed__ = false;
        });
      }, 'raa-template');
    },

    uninstall(raa) {}
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  // ═══════════════════════════════════════════════════════
  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaTemplate] window.Raa tidak ditemukan. Muat raa-v3.1.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaTemplatePlugin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
