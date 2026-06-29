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
    /* Horizon cart count badges */
    document.querySelectorAll(
      '.theme-drawer__badge, .cart-bubble__text, [data-cart-count]'
    ).forEach(function (el) {
      el.textContent = count;
    });
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

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ id: variantId, quantity: 1 }),
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

      return fetch('/cart.js').then(function (r) { return r.json(); });
    })
    .then(function (cart) {
      updateCartBadges(cart.item_count);

      if (isCartPage) {
        /* Cart page: reload so Liquid re-renders totals and filters out
           the newly added product from the FBT list. */
        setTimeout(function () { window.location.reload(); }, 900);
        return;
      }

      /* Drawer: fade and remove the card, hide section if empty. */
      setTimeout(function () {
        if (!card) return;
        card.classList.add('fbt-removing');
        setTimeout(function () {
          var list = card.parentNode;
          if (list) list.removeChild(card);
          if (list && list.children.length === 0) {
            var section = list.closest('.fbt-section');
            if (section) section.remove();
          }
        }, 320);
      }, 1400);
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
