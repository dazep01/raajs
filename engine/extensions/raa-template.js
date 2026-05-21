/**
 * RaaJS Template Extension | v2.2.0
 * File: raa-template.js
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Arsitek Modular" (Blueprint Architect). Ekstensi ini 
 * adalah sistem cetak biru yang memungkinkan komponen HTML dibuat 
 * sekali dan digunakan berkali-kali tanpa kehilangan jiwa 
 * reaktifnya, menciptakan struktur yang rapi dan terorganisir. [1]
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-template:define : Mendefinisikan cetak biru (blueprint) komponen. [1, 2]
 * - raa-template:use    : Memanggil dan merender instansi komponen ke DOM. [1, 3]
 * - raa-template:data   : Menyuntikkan state lokal (data) khusus untuk instansi. [1, 4]
 * - <slot name="...">   : Lubang konten dinamis (Named & Default) dengan fallback. [1, 5]
 * - window.RaaTemplate  : API kontrol manual untuk registrasi template via JS. [6, 7]
 * ───────────────────────────────────────────────────────────
 *  ✨ FITUR
 * - Template reusable deklaratif
 * - State lokal per instance (island-scoped)
 * - Slot dengan fallback content
 * - Reaktif penuh dalam template
 * - CSP‑safe, no eval
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Declarative Reusable, Island-Scoped State, Fallback Content, 
 *   Full Reactive, CSP-Safe (No-Eval). [1]
 * 
 * "Membangun sekali, menginspirasi berkali-kali."
 * ───────────────────────────────────────────────────────────
 */

(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaTemplate] RaaJS not found. Load raa.js first.');
    return;
  }

  const Raa = window.Raa;
  const doc = document;

  // Registry template: name → { template, fragment }
  const templateRegistry = new Map();

  // ═══════════════════════════════════════════════════
  //  OVERRIDE compileRoot UNTUK MENANGKAP define
  // ═══════════════════════════════════════════════════
  const originalCompileRoot = Raa.compileRoot.bind(Raa);
  Raa.compileRoot = function (root) {
    // Tangkap raa-template:define SEBELUM kompilasi
    captureDefines(root);
    // Panggil original
    const state = originalCompileRoot(root);
    if (!state) return state;

    // Setelah subtree dikompilasi, proses raa-template:use
    processUses(root, state);

    return state;
  };

  function captureDefines(root) {
    const defines = root.querySelectorAll('[raa-template\\:define]');
    defines.forEach(el => {
      const name = el.getAttribute('raa-template:define');
      if (!name || templateRegistry.has(name)) {
        if (el.tagName === 'TEMPLATE') el.remove();
        return;
      }

      let content;
      if (el.tagName === 'TEMPLATE') {
        content = el.content.cloneNode(true);
      } else {
        // Jika bukan <template>, bungkus kontennya sebagai fragmen
        const frag = doc.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        content = frag;
      }

      templateRegistry.set(name, content);
      // Hapus elemen definisi dari DOM
      el.remove();
    });
  }

  function processUses(root, state) {
    const uses = root.querySelectorAll('[raa-template\\:use]');
    uses.forEach(el => {
      if (el.__raa_template_processed__) return;
      el.__raa_template_processed__ = true;

      const templateName = el.getAttribute('raa-template:use');
      if (!templateName) return;

      const templateContent = templateRegistry.get(templateName);
      if (!templateContent) {
        console.warn(`[RaaTemplate] Template "${templateName}" not found.`);
        return;
      }

      // Clone template
      const clone = templateContent.cloneNode(true);

      // Proses slot
      processSlots(clone, el);

      // Data untuk instance (opsional)
      let instanceData = {};
      const dataExpr = el.getAttribute('raa-template:data');
      if (dataExpr) {
        try {
          instanceData = Raa.evaluate(dataExpr, state, el);
        } catch (e) {
          console.warn('[RaaTemplate] Invalid data expression:', dataExpr, e);
        }
      }

      // Buat wrapper island untuk scoped state
      const wrapper = doc.createElement('div');
      wrapper.setAttribute('raa-eco:island', '');
      wrapper.setAttribute('raa-core:data', JSON.stringify(instanceData));
      wrapper.style.display = 'contents'; // transparan terhadap layout

      // Pindahkan clone ke wrapper
      while (clone.firstChild) {
        wrapper.appendChild(clone.firstChild);
      }

      // Ganti elemen use dengan wrapper
      el.parentNode.replaceChild(wrapper, el);

      // Kompilasi wrapper sebagai root baru (island)
      queueMicrotask(() => {
        Raa.compileRoot(wrapper);
      });
    });
  }

  function processSlots(clone, useEl) {
    // Kumpulkan slot content dari useEl
    const slotContents = new Map(); // name → DocumentFragment
    const defaultSlotContent = doc.createDocumentFragment();
    let hasNamedSlot = false;

    Array.from(useEl.childNodes).forEach(child => {
      if (child.nodeType === 1 && child.hasAttribute('slot')) {
        const slotName = child.getAttribute('slot');
        if (!slotContents.has(slotName)) {
          slotContents.set(slotName, doc.createDocumentFragment());
        }
        slotContents.get(slotName).appendChild(child);
        hasNamedSlot = true;
      } else {
        defaultSlotContent.appendChild(child);
      }
    });

    // Jika tidak ada slot yang diberi nama, semua konten masuk ke default slot
    if (!hasNamedSlot && defaultSlotContent.childNodes.length) {
      slotContents.set('default', defaultSlotContent);
    } else if (defaultSlotContent.childNodes.length) {
      slotContents.set('default', defaultSlotContent);
    }

    // Ganti elemen <slot> di dalam clone
    const slots = clone.querySelectorAll('slot');
    slots.forEach(slotEl => {
      const slotName = slotEl.getAttribute('name') || 'default';
      const content = slotContents.get(slotName);

      if (content && content.childNodes.length) {
        slotEl.parentNode.replaceChild(content.cloneNode(true), slotEl);
      }
      // Jika tidak ada content, biarkan fallback (isi default slot) tetap
      // (tapi slotEl sendiri perlu diganti dengan isinya)
      else if (slotEl.childNodes.length) {
        // Fallback: ganti slot dengan isinya sendiri
        const fallback = doc.createDocumentFragment();
        while (slotEl.firstChild) fallback.appendChild(slotEl.firstChild);
        slotEl.parentNode.replaceChild(fallback, slotEl);
      } else {
        // Kosong
        slotEl.parentNode.removeChild(slotEl);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  OVERRIDE destroyRoot UNTUK CLEANUP
  // ═══════════════════════════════════════════════════
  const originalDestroyRoot = Raa.destroyRoot.bind(Raa);
  Raa.destroyRoot = function (root) {
    // Bersihkan penanda template use jika ada
    root.querySelectorAll('[raa-template\\:use]').forEach(el => {
      el.__raa_template_processed__ = false;
    });
    originalDestroyRoot(root);
  };

  // ═══════════════════════════════════════════════════
  //  PUBLIC API (MINIMAL)
  // ═══════════════════════════════════════════════════
  window.RaaTemplate = {
    /**
     * Daftarkan template secara manual (via JS)
     * @param {string} name
     * @param {string|Element} html - string HTML atau elemen template
     */
    define(name, html) {
      let content;
      if (typeof html === 'string') {
        const tpl = doc.createElement('template');
        tpl.innerHTML = html;
        content = tpl.content.cloneNode(true);
      } else if (html instanceof Element) {
        content = html.content ? html.content.cloneNode(true) : html.cloneNode(true);
      } else {
        return;
      }
      templateRegistry.set(name, content);
    },

    /**
     * Cek apakah template terdaftar
     */
    has(name) {
      return templateRegistry.has(name);
    },

    /**
     * Hapus template
     */
    remove(name) {
      templateRegistry.delete(name);
    },

    /**
     * Dapatkan konten template (untuk debugging)
     */
    get(name) {
      return templateRegistry.get(name) || null;
    }
  };

  console.log('[RaaTemplate] v1.0 loaded. Directives: define, use, data.');
})();