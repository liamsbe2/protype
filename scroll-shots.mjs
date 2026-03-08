import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3007', { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for frames to load
await new Promise(r => setTimeout(r, 6000));

// Hero after animations
await page.screenshot({ path: 'temporary screenshots/screenshot-3-hero-animated.png' });
console.log('Hero saved');

// Helper: scroll to a specific GSAP progress (0–1) through the scroll container
// progress = (scrollY - sc.offsetTop) / (sc.scrollHeight - viewportH)
// => scrollY = sc.offsetTop + progress * (sc.scrollHeight - viewportH)
async function scrollToProgress(page, progress) {
  await page.evaluate((p) => {
    const sc = document.getElementById('scroll-container');
    const target = sc.offsetTop + p * (sc.offsetHeight - window.innerHeight);
    if (window._lenis) window._lenis.stop();
    window.scrollTo(0, target);
    document.documentElement.scrollTop = target;
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    if (window.gsap) window.gsap.ticker.tick();
  }, progress);
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    if (window.gsap) window.gsap.ticker.tick();
  });
  await new Promise(r => setTimeout(r, 400));
}

// Scroll to section 1 midpoint (progress 0.12)
await scrollToProgress(page, 0.12);
await page.screenshot({ path: 'temporary screenshots/screenshot-4-section1.png' });
console.log('Section 1 saved');

// Scroll to section 2 midpoint (progress 0.30)
await scrollToProgress(page, 0.30);
await page.screenshot({ path: 'temporary screenshots/screenshot-5-section2.png' });
console.log('Section 2 saved');

// Scroll to stats midpoint (progress 0.64)
await scrollToProgress(page, 0.64);
await page.screenshot({ path: 'temporary screenshots/screenshot-6-stats.png' });
console.log('Stats saved');

// Scroll to CTA (progress 0.93)
await scrollToProgress(page, 0.93);
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: 'temporary screenshots/screenshot-7-cta.png' });
console.log('CTA saved');

await browser.close();
console.log('Done');
