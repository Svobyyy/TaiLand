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

  /* Element refs are collected once per start() instead of re-querying the
     whole document every second — the DOM only changes on section reload,
     which re-runs start(). */
  var targets = [];

  function collect() {
    targets = [];
    var els = document.querySelectorAll('[data-tailand-countdown]');
    for (var i = 0; i < els.length; i++) {
      targets.push({
        h: els[i].querySelector('[data-cd-h]'),
        m: els[i].querySelector('[data-cd-m]'),
        s: els[i].querySelector('[data-cd-s]'),
      });
    }
  }

  function updateAll() {
    var total = Math.max(0, Math.floor(msUntilMidnight() / 1000));
    var hStr  = pad(Math.floor(total / 3600));
    var mStr  = pad(Math.floor((total % 3600) / 60));
    var sStr  = pad(total % 60);

    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.h) t.h.textContent = hStr;
      if (t.m) t.m.textContent = mStr;
      if (t.s) t.s.textContent = sStr;
    }
  }

  function start() {
    /* Clear any previous interval so theme editor section reloads
       do not stack up multiple intervals on window. */
    if (window._TailandCD) clearInterval(window._TailandCD);
    collect();
    if (!targets.length) return;
    updateAll();
    window._TailandCD = setInterval(updateAll, 1000);
  }

  /* No point ticking a timer nobody can see — pause while the tab is
     hidden, catch up immediately on return. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (window._TailandCD) { clearInterval(window._TailandCD); window._TailandCD = null; }
    } else {
      start();
    }
  });

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
