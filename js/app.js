/* ============================================================
   LUMINA DENTAL — app.js
   Canvas frame animation + GSAP scroll sections
   ============================================================ */

const FRAME_COUNT = 192;
const FRAME_SPEED = 2.0;
const frames = new Array(FRAME_COUNT).fill(null);
let loadedCount = 0;
let currentFrame = 0;
let bgColor = '#080C11';

// ─── DOM REFS ──────────────────────────────────────────────
const loader      = document.getElementById('loader');
const loaderBar   = document.getElementById('loader-bar');
const loaderPct   = document.getElementById('loader-percent');
const canvasWrap  = document.getElementById('canvas-wrap');
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const scrollCont  = document.getElementById('scroll-container');
const overlay     = document.getElementById('dark-overlay');
const heroSection = document.getElementById('hero');
const heroWords   = document.querySelectorAll('.hero-word');
const heroTagline = document.querySelector('.hero-tagline');
const heroCta     = document.querySelector('.hero-cta');
const heroScroll  = document.querySelector('.hero-scroll-indicator');
const heroBadge   = document.querySelector('.hero-badge');
const marquee1    = document.getElementById('marquee1');

// ─── CANVAS RESIZE ─────────────────────────────────────────
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× for mobile performance
  canvas.width  = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  if (frames[currentFrame]) drawFrame(currentFrame);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── BACKGROUND SAMPLING ───────────────────────────────────
function sampleBgColor(img) {
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCanvas.width = 4;
  tmpCanvas.height = 4;
  tmpCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 4, 4);
  const d = tmpCtx.getImageData(0, 0, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

// ─── DRAW FRAME ─────────────────────────────────────────────
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const IMAGE_SCALE = 0.87;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ─── FRAME LOADER ──────────────────────────────────────────
function loadFrame(i) {
  return new Promise((resolve) => {
    const img = new Image();
    const n = String(i + 1).padStart(4, '0');
    img.src = `frames/frame_${n}.webp`;
    img.onload = () => {
      frames[i] = img;
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + '%';
      loaderPct.textContent = pct + '%';
      if (i % 20 === 0) bgColor = sampleBgColor(img);
      resolve();
    };
    img.onerror = resolve;
  });
}

async function preloadFrames() {
  // Phase 1: load first 12 frames fast
  const phase1 = [];
  for (let i = 0; i < Math.min(12, FRAME_COUNT); i++) phase1.push(loadFrame(i));
  await Promise.all(phase1);

  // Show first frame immediately
  drawFrame(0);

  // Phase 2: load remaining frames in background
  const phase2 = [];
  for (let i = 12; i < FRAME_COUNT; i++) phase2.push(loadFrame(i));
  await Promise.all(phase2);

  // All frames ready — hide loader and begin experience
  hideLoader();
}

// ─── HIDE LOADER ───────────────────────────────────────────
function hideLoader() {
  loader.classList.add('hidden');
  setTimeout(() => {
    loader.style.display = 'none';
    initExperience();
  }, 800);
}

// ─── TOUCH DEVICE DETECTION ────────────────────────────────
function isTouchDevice() {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

// ─── LENIS SMOOTH SCROLL ───────────────────────────────────
let lenis;
function initLenis() {
  if (isTouchDevice()) {
    // On mobile, use native scroll — Lenis interferes with touch
    ScrollTrigger.normalizeScroll(true);
    return;
  }
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Expose for screenshot tooling
  window._lenis = lenis;
}

// ─── HERO ENTRANCE ─────────────────────────────────────────
function animateHeroIn() {
  const tl = gsap.timeline({ delay: 0.2 });

  tl.to(heroWords, {
    y: 0,
    opacity: 1,
    duration: 1.1,
    stagger: 0.08,
    ease: 'power3.out',
  });
  tl.to([heroTagline, heroCta], {
    y: 0,
    opacity: 1,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
  }, '-=0.4');
  tl.to([heroScroll, heroBadge], {
    opacity: 1,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
  }, '-=0.3');
}

// ─── HERO → CANVAS TRANSITION ──────────────────────────────
function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;

      // Hero fades out fast as scroll begins
      heroSection.style.opacity = Math.max(0, 1 - p * 18);
      heroSection.style.transform = `scale(${1 - p * 0.05})`;

      // Canvas reveals via expanding circle clip-path
      const wipe = Math.min(1, Math.max(0, (p - 0.005) / 0.07));
      const radius = wipe * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    }
  });
}

// ─── CANVAS FRAME SCROLL ───────────────────────────────────
function initCanvasScroll() {
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

// ─── DARK OVERLAY ──────────────────────────────────────────
function initDarkOverlay() {
  const enter = 0.56;
  const leave = 0.72;
  const fade  = 0.04;

  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      let opacity = 0;
      if (p >= enter - fade && p <= enter) {
        opacity = (p - (enter - fade)) / fade;
      } else if (p > enter && p < leave) {
        opacity = 0.92;
      } else if (p >= leave && p <= leave + fade) {
        opacity = 0.92 * (1 - (p - leave) / fade);
      }
      overlay.style.opacity = opacity;
    }
  });
}

// ─── MARQUEE ───────────────────────────────────────────────
function initMarquee() {
  const marqueeText = marquee1.querySelector('.marquee-text');
  const speed = parseFloat(marquee1.dataset.scrollSpeed) || -30;

  gsap.to(marqueeText, {
    xPercent: speed,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    }
  });

  // Fade marquee in/out based on scroll position
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      // Show marquee between 30% and 50%
      let op = 0;
      if (p >= 0.27 && p <= 0.32) op = (p - 0.27) / 0.05;
      else if (p > 0.32 && p < 0.48) op = 1;
      else if (p >= 0.48 && p <= 0.54) op = 1 - (p - 0.48) / 0.06;
      marquee1.style.opacity = op;
    }
  });
}

// ─── SECTION ANIMATIONS ────────────────────────────────────
function setupSectionAnimation(section) {
  const type    = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const enter   = parseFloat(section.dataset.enter) / 100;
  const leave   = parseFloat(section.dataset.leave) / 100;
  const mid     = (enter + leave) / 2;

  // Use offsetHeight (respects CSS height declaration, not inflated by children)
  const totalH    = scrollCont.offsetHeight;
  const viewportH = window.innerHeight;
  // CTA section: shift up so tall heading isn't cut at top
  const verticalOffset = persist ? -viewportH * 0.08 : 0;
  const sectionTop = mid * (totalH - viewportH) + viewportH / 2 + verticalOffset;
  section.style.top = sectionTop + 'px';

  const children = section.querySelectorAll(
    '.section-label, .section-heading, .section-body, .section-note, .section-link,' +
    ' .cta-heading, .cta-body, .cta-actions, .cta-note,' +
    ' .stat, .stat-top'
  );

  // Build entrance timeline
  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case 'fade-up':
      tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' });
      break;
    case 'slide-left':
      tl.from(children, { x: -80, opacity: 0, stagger: 0.13, duration: 0.9, ease: 'power3.out' });
      break;
    case 'slide-right':
      tl.from(children, { x: 80, opacity: 0, stagger: 0.13, duration: 0.9, ease: 'power3.out' });
      break;
    case 'scale-up':
      tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out' });
      break;
    case 'rotate-in':
      tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.10, duration: 0.9, ease: 'power3.out' });
      break;
    case 'stagger-up':
      tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' });
      break;
    case 'clip-reveal':
      tl.from(children, {
        clipPath: 'inset(100% 0 0 0)',
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power4.inOut',
      });
      break;
    default:
      tl.from(children, { y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
  }

  let hasPlayed = false;
  // Start hidden
  section.style.opacity = '0';

  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: false,
    onUpdate(self) {
      const p = self.progress;
      const inRange = p >= enter && p <= leave;

      if (inRange) {
        section.classList.add('visible');
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
        if (!hasPlayed) {
          tl.play();
          hasPlayed = true;
        }
      } else if (persist && hasPlayed) {
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
      } else if (!inRange) {
        // Fade out gradually at edges
        const fadeRange = 0.025;
        let op = 0;
        if (p < enter) {
          op = Math.max(0, 1 - (enter - p) / fadeRange);
        } else {
          op = Math.max(0, 1 - (p - leave) / fadeRange);
        }
        section.style.opacity = op;
        if (op === 0) {
          section.classList.remove('visible');
          section.style.pointerEvents = 'none';
          if (hasPlayed) { tl.pause(0); hasPlayed = false; }
        }
      }
    }
  });
}

// ─── COUNTER ANIMATIONS ────────────────────────────────────
function initCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0');

    ScrollTrigger.create({
      trigger: el.closest('.scroll-section'),
      start: 'top 70%',
      onEnter() {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power1.out',
          onUpdate() {
            el.textContent = decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString();
          }
        });
      }
    });
  });
}

// ─── MOBILE HELPERS ────────────────────────────────────────
function isMobile() {
  return window.innerWidth <= 600;
}

function isTablet() {
  return window.innerWidth <= 900;
}

// Reposition sections on window resize (orientation change, etc.)
function repositionSections() {
  document.querySelectorAll('.scroll-section').forEach(section => {
    const enter    = parseFloat(section.dataset.enter) / 100;
    const leave    = parseFloat(section.dataset.leave) / 100;
    const persist  = section.dataset.persist === 'true';
    const mid      = (enter + leave) / 2;
    const totalH   = scrollCont.offsetHeight;
    const viewportH = window.innerHeight;
    const verticalOffset = persist ? -viewportH * 0.08 : 0;
    const sectionTop = mid * (totalH - viewportH) + viewportH / 2 + verticalOffset;
    section.style.top = sectionTop + 'px';
  });
  ScrollTrigger.refresh();
}

let resizeTimer;
let lastResizeWidth = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
    // Only reposition sections on width change (not mobile address-bar height changes)
    if (window.innerWidth !== lastResizeWidth) {
      lastResizeWidth = window.innerWidth;
      repositionSections();
    }
  }, 150);
});

// ─── INIT EXPERIENCE ───────────────────────────────────────
function initExperience() {
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  animateHeroIn();
  initHeroTransition();
  initCanvasScroll();
  initDarkOverlay();
  initMarquee();

  // Setup all scroll sections
  document.querySelectorAll('.scroll-section').forEach(setupSectionAnimation);
  initCounters();

  ScrollTrigger.refresh();
}

// ─── START ─────────────────────────────────────────────────
preloadFrames();
