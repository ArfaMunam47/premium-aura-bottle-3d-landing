// Handles all DOM-side interactions: cursor, magnetic buttons, reveal on scroll, accordion, counters, pricing toggle.

export function initUI() {
  // Loader
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
    }, 1600);
  });
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
  }, 3200);

  // Custom cursor
  const dot = document.getElementById('cursor-dot');
  const glow = document.getElementById('cursor-glow');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let gx = mx, gy = my;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  function animCursor() {
    gx += (mx - gx) * 0.18;
    gy += (my - gy) * 0.18;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();

  document.querySelectorAll('a, button, .swatch, .acc-head, .usp-card, .feature-card, .pain-card, .audience-card, .price-card').forEach(el => {
    el.addEventListener('mouseenter', () => glow.classList.add('hover'));
    el.addEventListener('mouseleave', () => glow.classList.remove('hover'));
  });

  // Navbar scroll state
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  // Magnetic buttons
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
    });
  });

  // Reveal on scroll (IntersectionObserver)
  const revealTargets = document.querySelectorAll('.section, .pain-card, .usp-card, .feature-card, .audience-card, .compare-col, .proof-card, .price-card, .outcome-pill');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        if (entry.target.classList.contains('proof-card')) animateCounter(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealTargets.forEach(el => io.observe(el));

  // Animated counters
  function animateCounter(card) {
    const numEl = card.querySelector('.proof-num');
    if (!numEl || numEl.dataset.done) return;
    numEl.dataset.done = '1';
    const target = parseFloat(numEl.dataset.count);
    const isDecimal = target % 1 !== 0;
    let cur = 0;
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      cur = target * eased;
      numEl.textContent = isDecimal ? cur.toFixed(1) : Math.round(cur).toLocaleString() + (target >= 30 && target < 1000 ? '+' : (target >= 1000 ? '+' : ''));
      if (t < 1) requestAnimationFrame(step);
      else numEl.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString() + (target >= 30 ? '+' : '');
    }
    requestAnimationFrame(step);
  }

  // Accordion
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Timeline steps
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
      const pct = (activeCount / timelineSteps.length) * 100;
      timelineFill.style.height = pct + '%';
    }
  }
  window.addEventListener('scroll', updateTimeline);
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

  return {};
}