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

// Seed the auth session before ANY page script runs, so ProtectedRoute
// lets us into /editor instead of redirecting to the landing page.
await page.evaluateOnNewDocument((u) => {
  localStorage.setItem('google_id_token', 'fake-jwt-token');
  localStorage.setItem('notesync_token', 'fake-jwt-token');
  localStorage.setItem('notesync_session', JSON.stringify(u));
}, userStub);

// Stub every /api/ request so the editor can render without a live backend.
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (req.url().includes('/api/')) {
    const body = JSON.stringify({ lecture: lectureStub, subject: subjectStub });
    req.respond({ status: 200, contentType: 'application/json', body });
  } else {
    req.continue();
  }
});

try {
  await page.goto(`${BASE}/editor/${LECTURE_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
} catch (e) {
  console.log('goto_warning:', e.message);
}
await new Promise((r) => setTimeout(r, 2500));

const before = await page.evaluate(() => ({
  path: location.pathname,
  hasChatTab: !!Array.from(document.querySelectorAll('button[role="tab"]')).find((b) => b.textContent.includes('Chat')),
  bodyHasLecture: document.body.innerText.includes('Test Lecture'),
  topbar: !!document.querySelector('.topbar'),
  pillTabs: !!document.querySelector('.pill-tabs'),
}));

const clicked = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button[role="tab"]')).find((b) => b.textContent.includes('Chat'));
  if (!btn) return false;
  btn.click();
  return true;
});

await new Promise((r) => setTimeout(r, 1200));

const after = await page.evaluate(() => {
  let drawer = null;
  for (const el of document.querySelectorAll('div')) {
    const cs = getComputedStyle(el);
    if (
      cs.position === 'fixed' &&
      cs.right === '0px' &&
      parseInt(cs.zIndex, 10) === 50 &&
      parseFloat(cs.width) >= 370 &&
      parseFloat(cs.width) <= 450
    ) {
      if (el.textContent.includes('Ask your notes')) {
        drawer = { width: cs.width, right: cs.right, top: cs.top, bottom: cs.bottom, zIndex: cs.zIndex };
        break;
      }
    }
  }
  const chatTab = Array.from(document.querySelectorAll('button[role="tab"]')).find((b) => b.textContent.includes('Chat'));
  return {
    drawer,
    closeBtn: !!document.querySelector('[aria-label="Close chat"]'),
    headerText: document.body.innerText.includes('Ask your notes'),
    editorStillVisible: document.body.innerText.includes('Test Lecture'),
    topbarStillVisible: !!document.querySelector('.topbar'),
    viewportW: window.innerWidth,
    path: location.pathname,
  };
});

console.log(JSON.stringify({ before, clicked, after }, null, 2));
await page.screenshot({ path: 'chatcheck_final.png' });
await browser.close();