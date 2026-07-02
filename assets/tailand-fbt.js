/**
 * Tailand FBT — Frequently Bought Together add-to-cart handler.
 * One delegated listener on document handles all .fbt-btn clicks.
 */
(function () {
  'use strict';

  if (window._TailandFBT) return;
  window._TailandFBT = true;

  var isCartPage = /^\/cart(\/|$|\?)/.test(window.location.pathname);

  function updateCartBadges(count) {
    document.querySelectorAll(
      '.theme-drawer__badge, .cart-bubble__text-count, [data-cart-count]'
    ).forEach(function (el) {
      el.textContent = count;
    });
  }

  /**
   * Refresh the cart drawer using the theme's morphSection (smart DOM diffing)
   * when available, falling back to a raw replaceWith.
   */
  function refreshCartDrawer(sectionsHtml) {
    var morphFn = window._tailandMorphSection;
    if (typeof morphFn === 'function') {
      morphFn('cart-drawer-section', sectionsHtml, {
        mode: 'hydration',
        injectStylesheet: true
      }).catch(function () {
        replaceCartDrawerFallback(sectionsHtml);
      });
    } else {
      replaceCartDrawerFallback(sectionsHtml);
    }
  }

  function replaceCartDrawerFallback(sectionsHtml) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(sectionsHtml, 'text/html');
    var newEl  = doc.querySelector('[data-hydration-key="cart-drawer-inner"]');
    var curEl  = document.querySelector('[data-hydration-key="cart-drawer-inner"]');
    if (newEl && curEl) curEl.replaceWith(newEl);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-fbt-add]');
    if (!btn || btn.disabled) return;

    var variantId = Number(btn.getAttribute('data-fbt-variant'));
    if (!variantId) return;

    var card  = btn.closest('[data-fbt-card]');
    var errEl = card && card.querySelector('.fbt-error');

    btn.disabled    = true;
    btn.textContent = '...';

    var payload = { id: variantId, quantity: 1 };
    if (!isCartPage) {
      payload.sections = 'cart-drawer-section';
    }

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(payload),
    })
    .then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, data: d }; });
    })
    .then(function (res) {
      if (!res.ok) {
        var msg = (res.data && (res.data.description || res.data.message)) || 'Could not add item.';
        throw new Error(msg);
      }

      btn.textContent = 'Added ✓';
      btn.classList.add('fbt-added');

      if (isCartPage) {
        setTimeout(function () { window.location.reload(); }, 900);
        return Promise.resolve(null);
      }

      var sectionHtml = res.data.sections && res.data.sections['cart-drawer-section'];
      // Refresh immediately — morphSection handles concurrent calls safely
      if (sectionHtml) refreshCartDrawer(sectionHtml);

      return fetch('/cart.js').then(function (r) { return r.json(); });
    })
    .then(function (cart) {
      if (!cart) return;
      updateCartBadges(cart.item_count);
    })
    .catch(function (err) {
      btn.disabled    = false;
      btn.textContent = 'Add';
      if (errEl) {
        errEl.textContent = (err && err.message) || 'Error. Try again.';
        errEl.classList.add('fbt-visible');
        setTimeout(function () { errEl.classList.remove('fbt-visible'); }, 3500);
      }
    });
  });
})();
