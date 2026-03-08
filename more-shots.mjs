import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3007', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 6000));

async function scrollToProgress(p) {
  await page.evaluate((prog) => {
    const sc = document.getElementById('scroll-container');
    const target = sc.offsetTop + prog * (sc.scrollHeight - window.innerHeight);
    window.scrollTo(0, target);
  }, p);
  await new Promise(r => setTimeout(r, 1800));
}

// Section 3: Technology (enter=40, leave=54, mid=0.47)
await scrollToProgress(0.47);
await page.screenshot({ path: 'temporary screenshots/shot-s3-technology.png' });
console.log('Section 3 (Technology) saved');

// Section 5: Team (enter=74, leave=87, mid=0.805)
await scrollToProgress(0.805);
await page.screenshot({ path: 'temporary screenshots/shot-s5-team.png' });
console.log('Section 5 (Team) saved');

// Marquee position (around 0.40)
await scrollToProgress(0.40);
await page.screenshot({ path: 'temporary screenshots/shot-marquee.png' });
console.log('Marquee saved');

await browser.close();
