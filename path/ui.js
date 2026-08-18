// DOM interactions: cursor, magnetic buttons, reveal on scroll, accordion, counters, pricing toggle.

export function initUI(options = {}) {
  const { prefersReducedMotion = false } = options;
  const callbacks = {};

  function hideLoader() {
    document.getElementById('loader')?.classList.add('hidden');
  }

  // Loader hides when 3D is ready so the cinematic unveil plays on canvas
  callbacks.onLoaderReady = hideLoader;
  callbacks.onIntroComplete = () => {
    document.querySelector('.scroll-hint')?.classList.add('visible');
  };
  setTimeout(hideLoader, 5000);

  // Custom cursor (desktop only, respects reduced motion)
  const dot = document.getElementById('cursor-dot');
  const glow = document.getElementById('cursor-glow');
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let gx = mx;
  let gy = my;

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      }
    });
    function animCursor() {
      gx += (mx - gx) * 0.15;
      gy += (my - gy) * 0.15;
      if (glow) {
        glow.style.left = gx + 'px';
        glow.style.top = gy + 'px';
      }
      requestAnimationFrame(animCursor);
    }
    animCursor();

    document.querySelectorAll('a, button, .swatch, .acc-head, .usp-card, .feature-card, .pain-card, .audience-card, .price-card').forEach(el => {
      el.addEventListener('mouseenter', () => glow?.classList.add('hover'));
      el.addEventListener('mouseleave', () => glow?.classList.remove('hover'));
    });
  } else {
    document.documentElement.classList.add('no-custom-cursor');
  }

  // Mobile navigation
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => {
    const open = navLinks?.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  });
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });

  // Navbar scroll state
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Magnetic buttons
  if (!prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.25}px, ${relY * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // CTA wiring
  document.querySelectorAll('[data-scroll-to]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(el.dataset.scrollTo);
      target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // Story progress dots
  document.querySelectorAll('.story-dot[data-scroll-to]').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(dot.dataset.scrollTo);
      target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // Hide navbar during intro
  const storyProgress = document.getElementById('story-progress');
  const observer = new MutationObserver(() => {
    const playing = document.body.classList.contains('intro-playing');
    navbar?.classList.toggle('intro-hidden', playing);
    storyProgress?.classList.toggle('intro-hidden', playing);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Newsletter
  const newsletterForm = document.querySelector('.newsletter-input');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input');
    const btn = newsletterForm.querySelector('button');
    if (input?.value && btn) {
      btn.textContent = 'Subscribed!';
      input.value = '';
      setTimeout(() => { btn.textContent = 'Subscribe'; }, 2500);
    }
  });

  // Reveal on scroll
  const revealTargets = document.querySelectorAll('.section, .pain-card, .usp-card, .feature-card, .audience-card, .compare-col, .proof-card, .price-card, .outcome-pill');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = prefersReducedMotion ? 0 : (entry.target.dataset.revealDelay || 0);
        setTimeout(() => entry.target.classList.add('reveal'), delay);
        if (entry.target.classList.contains('proof-card')) animateCounter(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.usp-card, .feature-card, .pain-card').forEach((el, i) => {
    el.dataset.revealDelay = (i % 4) * 80;
  });
  revealTargets.forEach(el => io.observe(el));

  function animateCounter(card) {
    const numEl = card.querySelector('.proof-num');
    if (!numEl || numEl.dataset.done) return;
    numEl.dataset.done = '1';
    const target = parseFloat(numEl.dataset.count);
    const isDecimal = target % 1 !== 0;
    if (prefersReducedMotion) {
      numEl.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString() + (target >= 30 ? '+' : '');
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = target * eased;
      numEl.textContent = isDecimal ? cur.toFixed(1) : Math.round(cur).toLocaleString() + (target >= 30 && target < 1000 ? '+' : (target >= 1000 ? '+' : ''));
      if (t < 1) requestAnimationFrame(step);
      else numEl.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString() + (target >= 30 ? '+' : '');
    }
    requestAnimationFrame(step);
  }

  // Accordion
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    head?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Timeline
  const timelineSteps = document.querySelectorAll('.timeline-step');
  const timelineFill = document.querySelector('.timeline-line-fill');
  function updateTimeline() {
    let activeCount = 0;
    timelineSteps.forEach(step => {
      const rect = step.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.75) {
        step.classList.add('active');
        activeCount++;
      } else {
        step.classList.remove('active');
      }
    });
    if (timelineFill && timelineSteps.length) {
      timelineFill.style.height = (activeCount / timelineSteps.length) * 100 + '%';
    }
  }
  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline();

  // Pricing toggle
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const priceAmts = document.querySelectorAll('.price-amt');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      priceAmts.forEach(amt => {
        const val = mode === 'monthly' ? amt.dataset.monthly : amt.dataset.onetime;
        amt.textContent = '$' + val + (mode === 'monthly' ? '/mo' : '');
      });
    });
  });

  return callbacks;
}
