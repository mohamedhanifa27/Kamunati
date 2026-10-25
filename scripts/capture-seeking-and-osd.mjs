import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9890;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-seeking-osd-data');

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

async function main() {
  console.log('--- Capturing Deep Seeking, 10s OSD, and Buffer Switch Button ---');
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

    // 1. Navigate to Whiplash
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/079491aa-2289-44d0-ad42-3bee13234e9f' });
    await sleep(4000);

    // Click Forward 10s multiple times to test consecutive 10s steps
    console.log('Testing multiple +10s steps...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const fwd = document.getElementById('fwd');
          if (fwd) {
            fwd.click();
            setTimeout(() => fwd.click(), 400);
            setTimeout(() => fwd.click(), 800);
          }
        })()
      `
    });
    await sleep(1000);

    // Capture screenshot with active +10s OSD banner
    console.log('Capturing whiplash_10s_osd_banner.png...');
    const shot1 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_10s_osd_banner.png'), Buffer.from(shot1.data, 'base64'));

    // 2. Test scrubber pointer seek to 25 minutes (1500s)
    console.log('Testing scrubber seek to 25 minutes...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const sk = document.getElementById('sk');
          if (sk) {
            const rect = sk.getBoundingClientRect();
            // Dispatch pointerdown at 25% across the scrubber rail
            const x = rect.left + rect.width * 0.25;
            const y = rect.top + rect.height / 2;
            sk.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
          }
        })()
      `
    });
    await sleep(3500);

    console.log('Capturing whiplash_scrubber_seeking_25min.png...');
    const shot2 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_scrubber_seeking_25min.png'), Buffer.from(shot2.data, 'base64'));

    // 3. Test Buffer Screen Switch Server Button
    console.log('Testing loading screen with switch server button...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const pp = document.getElementById('pp');
          if (pp) {
            pp.classList.add('loading');
            const lm = document.getElementById('lm');
            if (lm) lm.textContent = 'Optimizing stream playback';
          }
        })()
      `
    });
    await sleep(600);

    console.log('Capturing loading_screen_switch_server_accessible.png...');
    const shot3 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'loading_screen_switch_server_accessible.png'), Buffer.from(shot3.data, 'base64'));

    client.close();
    console.log('All detailed tests captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main().catch(console.error);
