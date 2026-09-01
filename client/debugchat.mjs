import puppeteer from 'puppeteer';

const LECTURE_ID = 'cmsw9wmj00009oc5qrzyqgxjq';
const BASE = 'http://localhost:5174';

const lectureStub = {
  _id: LECTURE_ID,
  title: 'Test Lecture',
  lectureNumber: 1,
  rawNotes: '# hello world\n\nsome raw notes',
  processedNotes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const subjectStub = { _id: 'subj_test', name: 'Test Subject' };
const userStub = { _id: 'user_test', name: 'Test User', email: 'test@notesync.local', provider: 'email' };

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1470, height: 835 });

const consoleMsgs = [];
page.on('console', (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => consoleMsgs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => consoleMsgs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText || ''}`));

await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/')) {
    req.respond({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ lecture: lectureStub, subject: subjectStub }),
    });
  } else if (url.includes('accounts.google.com')) {
    req.respond({ status: 204, body: '' });
  } else {
    req.continue();
  }
});

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate((u) => {
  localStorage.setItem('notesync_token', 'fake-jwt-token');
  localStorage.setItem('google_id_token', 'fake-id-token');
  localStorage.setItem('notesync_session', JSON.stringify(u));
}, userStub);

await page.goto(`${BASE}/editor/${LECTURE_ID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const state = await page.evaluate(() => ({
  href: location.href,
  bodyStart: document.body.innerText.slice(0, 600),
  topbar: !!document.querySelector('.topbar'),
  tabCount: document.querySelectorAll('[role="tab"]').length,
  tabLabels: Array.from(document.querySelectorAll('[role="tab"]')).map((b) => b.textContent.trim()),
  appLoader: !!document.querySelector('.app-loader, [class*="loader"]'),
  rootChildCount: document.getElementById('root')?.children.length || 0,
}));

console.log(JSON.stringify({ state, consoleMsgs: consoleMsgs.slice(0, 30) }, null, 2));
await page.screenshot({ path: 'debugchat.png' });
await browser.close();