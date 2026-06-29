/**
 * Tailand shared countdown timer
 *
 * Finds every [data-tailand-countdown] element on the page and keeps
 * them all in sync with a single setInterval.
 *
 * Each element must contain children with:
 *   [data-cd-h]  → hours
 *   [data-cd-m]  → minutes
 *   [data-cd-s]  → seconds
 *
 * Timer counts down to midnight (local clock) then automatically rolls
 * over — no "Sale ended" state, no manual dates to maintain.
 */
(function () {
  'use strict';

  function msUntilMidnight() {
    var now      = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return midnight - now;
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function updateAll() {
    var total = Math.max(0, Math.floor(msUntilMidnight() / 1000));
    var h     = Math.floor(total / 3600);
    var m     = Math.floor((total % 3600) / 60);
    var s     = total % 60;
    var hStr  = pad(h);
    var mStr  = pad(m);
    var sStr  = pad(s);

    var els = document.querySelectorAll('[data-tailand-countdown]');
    for (var i = 0; i < els.length; i++) {
      var el  = els[i];
      var hEl = el.querySelector('[data-cd-h]');
      var mEl = el.querySelector('[data-cd-m]');
      var sEl = el.querySelector('[data-cd-s]');
      if (hEl) hEl.textContent = hStr;
      if (mEl) mEl.textContent = mStr;
      if (sEl) sEl.textContent = sStr;
    }
  }

  function start() {
    /* Clear any previous interval so theme editor section reloads
       do not stack up multiple intervals on window. */
    if (window._TailandCD) clearInterval(window._TailandCD);
    updateAll();
    window._TailandCD = setInterval(updateAll, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* Re-init after Shopify section reloads in the theme editor.
     Small delay lets the newly injected DOM settle before we query it. */
  document.addEventListener('shopify:section:load', function () {
    setTimeout(start, 50);
  });
})();
