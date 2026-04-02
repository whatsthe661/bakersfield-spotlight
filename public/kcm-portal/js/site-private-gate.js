/**
 * Optional passphrase for a hidden deploy on whatsthe661.com (or anywhere).
 * If data/kcm-private-passphrase.json is missing or "p" is empty, no gate (local dev).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'kcm_w661_gate_ok';

  async function run() {
    let phrase = '';
    try {
      const r = await fetch(new URL('data/kcm-private-passphrase.json', location.href), {
        cache: 'no-store',
      });
      if (r.ok) {
        const j = await r.json();
        phrase = String(j.p || '').trim();
      }
    } catch {
      /* no file */
    }

    if (!phrase) return;
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    document.documentElement.style.visibility = 'hidden';

    const u = window.prompt('Private page — enter access phrase');

    document.documentElement.style.visibility = '';

    if (u !== phrase) {
      window.location.replace(new URL('/', location.origin).href);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  run().catch(() => {
    document.documentElement.style.visibility = '';
  });
})();
