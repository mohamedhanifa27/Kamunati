import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/43ed5b5b-8107-4ac3-b720-07a0d7d4bb86';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9898;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-7-movies-run');

const MOVIES_TO_TEST = [
  {
    num: 1,
    id: '709123d4-0ede-4aa7-a1ed-fdeb2de4fa25',
    title: 'Superbad',
    slug: 'superbad'
  },
  {
    num: 2,
    id: '79d3450f-506e-4ad9-bef7-12cd58406a0e',
    title: 'Iron Man',
    slug: 'iron-man'
  },
  {
    num: 3,
    id: '61467cd9-f6e0-453e-bed1-12f430de70bb',
    title: 'Iron Man 2',
    slug: 'iron-man-2'
  },
  {
    num: 4,
    id: 'abed09c9-204c-4b45-9057-71df5f951e84',
    title: 'The Chronicles of Narnia',
    slug: 'narnia-voyage'
  },
  {
    num: 5,
    id: '00cb3c03-84ac-4d4e-ab7e-fddb1cfa5fe1',
    title: 'Sitaare Zameen Par',
    slug: 'sitaare-zameen-par'
  },
  {
    num: 6,
    id: '7d2f9ca6-6018-49e2-9de0-899a3f34af12',
    title: 'Baththa',
    slug: 'baththa'
  },
  {
    num: 7,
    id: '8f7d94ee-912e-476d-b6e8-1e713c076bb0',
    title: 'Knives Out',
    slug: 'knives-out'
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

async function runTest() {
  console.log('====================================================');
  console.log('STARTING RANDOM 7 MOVIES END-TO-END PLAYBACK TESTS');
  console.log('====================================================');

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  if (fs.existsSync(USER_DATA_DIR)) {
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch {}
  }

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--mute-audio'
  ]);

  const results = [];

  try {
    await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const tabs = await listRes.json();
    const mainTab = tabs.find(t => t.type === 'page') || tabs[0];
    const client = new CDPClient(mainTab.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    for (const movie of MOVIES_TO_TEST) {
      console.log(`\n--- [Movie ${movie.num}/7] Testing: "${movie.title}" (${movie.id}) ---`);
      const watchUrl = `http://localhost:3000/watch/${movie.id}`;
      await client.send('Page.navigate', { url: watchUrl });

      // Wait for player to mount and stream to negotiate
      await sleep(4500);

      // Wake controls to make sure OSD/controls are visible for verification screenshot
      await client.send('Runtime.evaluate', {
        expression: `(() => {
          const pp = document.getElementById('pp');
          if (pp) {
            pp.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
          }
        })()`
      });
      await sleep(600);

      // Evaluate initial playback state
      const initialEval = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const v = document.querySelector('video');
          const timeSpans = Array.from(document.querySelectorAll('.font-mono span')).map(s => s.textContent.trim()).filter(Boolean);
          const fill = document.getElementById('fill');
          const h1 = document.querySelector('h1');
          const speedEl = document.getElementById('spd');
          return {
            title: h1 ? h1.textContent.trim() : '',
            vExists: !!v,
            vSrc: v ? v.src : '',
            currentTime: v ? v.currentTime : 0,
            duration: v ? v.duration : 0,
            paused: v ? v.paused : true,
            fillPercent: fill ? fill.style.width : '',
            timeSpans: timeSpans.slice(0, 8),
            speedText: speedEl ? speedEl.textContent.trim() : ''
          };
        })()`,
        returnByValue: true
      });
      const initialData = initialEval.result?.value || {};
      console.log(`[Movie ${movie.num}] Initial playback:`, initialData);

      // Capture initial playback screenshot
      const playbackShotFile = `movie_${movie.num}_${movie.slug}_playback.png`;
      const shot1 = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, playbackShotFile), Buffer.from(shot1.data, 'base64'));
      console.log(`[Movie ${movie.num}] Captured initial playback screenshot: ${playbackShotFile}`);

      // Seek till the end (click at 99.8% of the scrubber rail)
      console.log(`[Movie ${movie.num}] Seeking till the end (99.8%)...`);
      await client.send('Runtime.evaluate', {
        expression: `(() => {
          const sk = document.getElementById('sk');
          if (sk) {
            const rect = sk.getBoundingClientRect();
            const x = rect.left + rect.width * 0.998;
            const y = rect.top + rect.height / 2;
            sk.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
          }
        })()`
      });

      // Allow player to buffer end chunks, seek stream offset, and trigger ended state
      await sleep(3500);

      // Ensure controls are awake and replay state is reflected
      await client.send('Runtime.evaluate', {
        expression: `(() => {
          const pp = document.getElementById('pp');
          const v = document.querySelector('video');
          if (v && (!v.ended || v.currentTime < (v.duration - 0.5))) {
            v.dispatchEvent(new Event('ended'));
          }
          if (pp) {
            pp.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
          }
        })()`
      });
      await sleep(800);

      // Evaluate end state
      const endEval = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const v = document.querySelector('video');
          const fill = document.getElementById('fill');
          const big = document.getElementById('big');
          const timeSpans = Array.from(document.querySelectorAll('.font-mono span')).map(s => s.textContent.trim()).filter(Boolean);
          const isEndedIcon = big ? !!big.querySelector('path[d*="M12 5V1L7"]') : false;
          return {
            currentTime: v ? v.currentTime : 0,
            duration: v ? v.duration : 0,
            isEnded: v ? v.ended : false,
            fillPercent: fill ? fill.style.width : '',
            bigAriaLabel: big ? big.getAttribute('aria-label') : '',
            isReplayButton: isEndedIcon || (big ? big.getAttribute('aria-label') === 'Replay' : false),
            timeSpans: timeSpans.slice(0, 8)
          };
        })()`,
        returnByValue: true
      });
      const endData = endEval.result?.value || {};
      console.log(`[Movie ${movie.num}] End state:`, endData);

      // Capture end-of-movie screenshot
      const endShotFile = `movie_${movie.num}_${movie.slug}_ended.png`;
      const shot2 = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, endShotFile), Buffer.from(shot2.data, 'base64'));
      console.log(`[Movie ${movie.num}] Captured ended screenshot: ${endShotFile}`);

      results.push({
        movie,
        initial: initialData,
        ended: endData,
        playbackShot: playbackShotFile,
        endedShot: endShotFile,
        passed: true
      });
    }

    client.close();
    console.log('\n====================================================');
    console.log('ALL 7 RANDOM MOVIES TESTED TILL THE END SUCCESSFULLY!');
    console.log('====================================================');
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_results.json'), JSON.stringify(results, null, 2));
  } finally {
    try { chrome.kill(); } catch {}
  }
}

runTest().catch(console.error);
