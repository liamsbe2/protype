import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

// iPhone 14 Pro viewport
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto('http://localhost:3007', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 6000));

async function scrollToProgress(p) {
  await page.evaluate((prog) => {
    const sc = document.getElementById('scroll-container');
    // Use offsetHeight (matches GSAP trigger end calculation)
    const target = sc.offsetTop + prog * (sc.offsetHeight - window.innerHeight);
    if (window._lenis) window._lenis.stop();
    window.scrollTo(0, target);
    document.documentElement.scrollTop = target;
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    if (window.gsap) window.gsap.ticker.tick();
  }, p);
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    if (window.gsap) window.gsap.ticker.tick();
  });
  await new Promise(r => setTimeout(r, 600));
}

// Hero
await page.screenshot({ path: 'temporary screenshots/mobile-hero.png' });
console.log('Mobile hero saved');

// Section 1
await scrollToProgress(0.12);
await page.screenshot({ path: 'temporary screenshots/mobile-section1.png' });
console.log('Mobile section 1 saved');

// Section 2
await scrollToProgress(0.30);
await page.screenshot({ path: 'temporary screenshots/mobile-section2.png' });
console.log('Mobile section 2 saved');

// Stats
await scrollToProgress(0.64);
await page.screenshot({ path: 'temporary screenshots/mobile-stats.png' });
console.log('Mobile stats saved');

// CTA
await scrollToProgress(0.93);
await page.screenshot({ path: 'temporary screenshots/mobile-cta.png' });
console.log('Mobile CTA saved');

await browser.close();
console.log('Done');
