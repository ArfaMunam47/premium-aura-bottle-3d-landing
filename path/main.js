import { addToCart, updateQty, removeFromCart, onCartChange, getState, clearCart, formatPrice } from './cart.js';
import { PRODUCT, findSize, findFinish } from './product-data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

function boot() {
  initLoader();
  initNav();
  initHeroVideo();
  initScrollReveals();
  initShowcaseTilt();
  initShop();
  initCart();
  initCheckout();
  initNewsletter();
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loader-fill');
  if (!loader) return;
  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(94, p + Math.random() * 22);
    if (fill) fill.style.width = p + '%';
  }, 110);
  const finish = () => {
    clearInterval(tick);
    if (fill) fill.style.width = '100%';
    setTimeout(() => loader.classList.add('hidden'), 250);
  };
  // Finish once the hero video can play, or after a short cap either way.
  const video = document.getElementById('hero-video');
  let done = false;
  const safeFinish = () => { if (!done) { done = true; finish(); } };
  if (video) {
    video.addEventListener('canplay', safeFinish, { once: true });
    video.addEventListener('error', safeFinish, { once: true });
  }
  setTimeout(safeFinish, 2200);
}

// ---------------------------------------------------------------------------
// Nav: transparent -> solid on scroll, mobile menu
// ---------------------------------------------------------------------------

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');

  function onScroll() {
    if (window.scrollY > window.innerHeight * 0.72) nav.classList.add('solid');
    else nav.classList.remove('solid');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('open', open);
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('open');
    }));
  }
}

// ---------------------------------------------------------------------------
// Hero video: graceful fallback if autoplay/video fails
// ---------------------------------------------------------------------------

function initHeroVideo() {
  const video = document.getElementById('hero-video');
  const fallback = document.getElementById('hero-fallback');
  if (!video) return;

  const showFallback = () => {
    console.warn('[AURA] Hero video unavailable — using the poster image instead.');
    video.style.display = 'none';
    if (fallback) fallback.hidden = false;
  };

  video.addEventListener('error', showFallback);

  // Some mobile browsers block autoplay even when muted+inline; if play()
  // is rejected, fall back to the static poster rather than a stalled video.
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Retry once on first user interaction (common mobile requirement).
      const retry = () => {
        video.play().catch(showFallback);
        window.removeEventListener('touchstart', retry);
        window.removeEventListener('click', retry);
      };
      window.addEventListener('touchstart', retry, { once: true, passive: true });
      window.addEventListener('click', retry, { once: true });
    });
  }
}

// ---------------------------------------------------------------------------
// Scroll reveals (fade/scale in as sections enter view)
// ---------------------------------------------------------------------------

function initScrollReveals() {
  const targets = document.querySelectorAll('.reveal-in, .details-grid .detail-card, .feature-row, .philosophy-inner');
  if (!targets.length) return;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  targets.forEach((t) => io.observe(t));
}

// ---------------------------------------------------------------------------
// Showcase: pseudo-3D tilt + moving sheen + detail pins
// (Single studio photo — this is an honest bounded tilt/lighting effect,
// not a fake 360° rotation.)
// ---------------------------------------------------------------------------

function initShowcaseTilt() {
  const stage = document.getElementById('showcase-stage');
  const tilt = document.getElementById('showcase-tilt');
  const sheen = document.getElementById('showcase-sheen');
  if (!stage || !tilt) return;

  if (!reducedMotion && !window.matchMedia('(hover: none)').matches) {
    let raf = null;
    function onMove(e) {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0..1
      const y = (e.clientY - rect.top) / rect.height;  // 0..1
      const rx = (0.5 - y) * 12;
      const ry = (x - 0.5) * 16;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        if (sheen) sheen.style.background =
          `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.16), transparent 45%)`;
      });
    }
    function onLeave() {
      tilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
      if (sheen) sheen.style.background = 'transparent';
    }
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
  }

  // Detail pins
  const caption = document.getElementById('pin-caption');
  document.querySelectorAll('.pin').forEach((pin) => {
    const show = () => {
      if (!caption) return;
      caption.textContent = pin.getAttribute('data-caption');
      caption.hidden = false;
      pin.classList.add('active');
    };
    const hide = () => {
      if (!caption) return;
      caption.hidden = true;
      pin.classList.remove('active');
    };
    pin.addEventListener('mouseenter', show);
    pin.addEventListener('focus', show);
    pin.addEventListener('mouseleave', hide);
    pin.addEventListener('blur', hide);
    pin.addEventListener('click', (e) => { e.preventDefault(); show(); });
  });
}

// ---------------------------------------------------------------------------
// Shop: size / finish / quantity selection
// ---------------------------------------------------------------------------

let selectedSize = PRODUCT.sizes[0].id;
let selectedFinish = PRODUCT.finishes[0].id;
let selectedQty = 1;

function initShop() {
  const sizeRow = document.getElementById('size-options');
  const finishRow = document.getElementById('finish-options');
  const priceEl = document.getElementById('shop-price');
  const qtyEl = document.getElementById('qty-value');
  const shopImg = document.getElementById('shop-img');
  const showcaseImg = document.getElementById('showcase-img');

  function updatePrice() {
    const size = findSize(selectedSize);
    if (priceEl) priceEl.textContent = formatPrice(size.price);
  }

  function updateFinishVisual() {
    const finish = findFinish(selectedFinish);
    const filterValue = finish.filter === 'none' ? '' : finish.filter;
    // Apply a subtle overall tint so the swatch choice is visible on the
    // single studio photo without fabricating extra product photography.
    if (shopImg) shopImg.style.filter = filterValue;
    if (showcaseImg) showcaseImg.style.filter = filterValue;
  }

  if (sizeRow) {
    sizeRow.querySelectorAll('.option-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        sizeRow.querySelectorAll('.option-pill').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        selectedSize = btn.getAttribute('data-size');
        updatePrice();
      });
    });
  }

  if (finishRow) {
    finishRow.querySelectorAll('.finish-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        finishRow.querySelectorAll('.finish-swatch').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        selectedFinish = btn.getAttribute('data-finish');
        updateFinishVisual();
      });
    });
  }

  const minus = document.getElementById('qty-minus');
  const plus = document.getElementById('qty-plus');
  if (minus) minus.addEventListener('click', () => {
    selectedQty = Math.max(1, selectedQty - 1);
    if (qtyEl) qtyEl.textContent = String(selectedQty);
  });
  if (plus) plus.addEventListener('click', () => {
    selectedQty = Math.min(9, selectedQty + 1);
    if (qtyEl) qtyEl.textContent = String(selectedQty);
  });

  const addBtn = document.getElementById('add-to-cart');
  if (addBtn) addBtn.addEventListener('click', () => {
    addToCart(selectedSize, selectedFinish, selectedQty);
    addBtn.classList.add('pressed');
    setTimeout(() => addBtn.classList.remove('pressed'), 220);
    showToast('Added to bag');
    selectedQty = 1;
    if (qtyEl) qtyEl.textContent = '1';
    openCart();
  });

  updatePrice();
  updateFinishVisual();
}

// ---------------------------------------------------------------------------
// Cart drawer
// ---------------------------------------------------------------------------

function openCart() {
  toggleDrawer('cart-drawer', true);
}
function closeCart() {
  toggleDrawer('cart-drawer', false);
}

function toggleDrawer(id, open) {
  const drawer = document.getElementById(id);
  const overlay = document.getElementById('drawer-overlay');
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  if (overlay) overlay.classList.toggle('open', open);
  document.body.classList.toggle('drawer-locked', open);
}

function renderCart(state) {
  const linesEl = document.getElementById('cart-lines');
  const emptyEl = document.getElementById('cart-empty');
  const footEl = document.getElementById('cart-foot');
  const subtotalEl = document.getElementById('cart-subtotal-amt');
  const countEl = document.getElementById('bag-count');

  if (!linesEl) return;

  if (state.lines.length === 0) {
    linesEl.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (footEl) footEl.hidden = true;
  } else {
    if (emptyEl) emptyEl.hidden = true;
    if (footEl) footEl.hidden = false;
    linesEl.innerHTML = state.lines.map((line) => `
      <div class="cart-line" data-key="${line.key}">
        <img src="${PRODUCT.image}" alt="" class="cart-line-img" />
        <div class="cart-line-info">
          <span class="cart-line-name">${PRODUCT.name}</span>
          <span class="cart-line-variant">${line.size.label} &middot; ${line.finish.label}</span>
          <div class="cart-line-qty">
            <button class="qty-btn small" data-action="dec" aria-label="Decrease quantity">–</button>
            <span>${line.qty}</span>
            <button class="qty-btn small" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-line-right">
          <span class="cart-line-price">${formatPrice(line.lineTotal)}</span>
          <button class="cart-line-remove" data-action="remove" aria-label="Remove item">Remove</button>
        </div>
      </div>
    `).join('');
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(state.subtotal);
  if (countEl) {
    if (state.count > 0) {
      countEl.textContent = String(state.count);
      countEl.hidden = false;
    } else {
      countEl.hidden = true;
    }
  }
}

function initCart() {
  const bagToggle = document.getElementById('bag-toggle');
  const closeBtn = document.getElementById('cart-close');
  const overlay = document.getElementById('drawer-overlay');
  const linesEl = document.getElementById('cart-lines');

  if (bagToggle) bagToggle.addEventListener('click', openCart);
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', () => {
    closeCart();
    toggleDrawer('checkout-drawer', false);
  });

  if (linesEl) {
    linesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const lineEl = btn.closest('.cart-line');
      const key = lineEl && lineEl.getAttribute('data-key');
      if (!key) return;
      const state = getState();
      const line = state.lines.find((l) => l.key === key);
      if (!line) return;
      if (btn.dataset.action === 'inc') updateQty(key, line.qty + 1);
      if (btn.dataset.action === 'dec') updateQty(key, line.qty - 1);
      if (btn.dataset.action === 'remove') removeFromCart(key);
    });
  }

  onCartChange(renderCart);
  renderCart(getState());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      toggleDrawer('checkout-drawer', false);
    }
  });
}

// ---------------------------------------------------------------------------
// Checkout (client-side demo — no backend exists to send this to)
// ---------------------------------------------------------------------------

function initCheckout() {
  const openBtn = document.getElementById('checkout-open');
  const closeBtn = document.getElementById('checkout-close');
  const form = document.getElementById('checkout-form');
  const success = document.getElementById('checkout-success');
  const summary = document.getElementById('checkout-summary');
  const doneBtn = document.getElementById('checkout-done');
  const orderNumberEl = document.getElementById('order-number');

  if (openBtn) openBtn.addEventListener('click', () => {
    const state = getState();
    if (summary) {
      summary.innerHTML = state.lines.map((l) =>
        `<div class="checkout-summary-line"><span>${l.size.label} &middot; ${l.finish.label} &times; ${l.qty}</span><span>${formatPrice(l.lineTotal)}</span></div>`
      ).join('') + `<div class="checkout-summary-line total"><span>Total</span><span>${formatPrice(state.subtotal)}</span></div>`;
    }
    toggleDrawer('cart-drawer', false);
    toggleDrawer('checkout-drawer', true);
  });

  if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer('checkout-drawer', false));

  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderNumber = 'AURA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (orderNumberEl) orderNumberEl.textContent = orderNumber;
    form.hidden = true;
    if (success) success.hidden = false;
    clearCart();
  });

  if (doneBtn) doneBtn.addEventListener('click', () => {
    toggleDrawer('checkout-drawer', false);
    setTimeout(() => {
      if (form) { form.hidden = false; form.reset(); }
      if (success) success.hidden = true;
    }, 300);
  });
}

// ---------------------------------------------------------------------------
// Newsletter (client-side only — no backend to send this to)
// ---------------------------------------------------------------------------

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.checkValidity()) return;
    input.value = '';
    showToast('Subscribed');
  });
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 1800);
}

ready(boot);
