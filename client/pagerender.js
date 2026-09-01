const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({args:['--no-sandbox']});
  const page = await browser.newPage();
    await page.goto('http://localhost:5174/editor/cmsw9wmj00009oc5qrzyqgxjq', {waitUntil:'networkidle2'});
  await page.waitForTimeout(2000);
  await page.screenshot({path:'screenshot.png', fullPage:true});
  await browser.close();
})();
