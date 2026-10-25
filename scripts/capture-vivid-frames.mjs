import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9876;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-stream-vivid-data');

const testCases = [
  {
    name: 'whiplash_server1_playing',
    title: 'Whiplash - Server 1 (1080p)',
    id: '079491aa-2289-44d0-ad42-3bee13234e9f',
    serverIndex: 0,
    seekTo: 12
  },
  {
    name: 'whiplash_server2_playing',
    title: 'Whiplash - Server 2 (4K)',
    id: '079491aa-2289-44d0-ad42-3bee13234e9f',
    serverIndex: 1,
    seekTo: 15
  },
  {
    name: 'taxidriver_server1_playing',
    title: 'Taxi Driver - Server 1 (1080p)',
    id: '01fd5a72-50b7-4a89-a482-70efbc6abb7a',
    serverIndex: 0,
    seekTo: 8
  },
  {
    name: 'superbad_server1_playing',
    title: 'Superbad - Server 1 (1080p)',
    id: '709123d4-0ede-4aa7-a1ed-fdeb2de4fa25',
    serverIndex: 0,
    seekTo: 14
  },
  {
    name: 'superbad_server2_playing',
    title: 'Superbad - Server 2 (4K)',
    id: '709123d4-0ede-4aa7-a1ed-fdeb2de4fa25',
    serverIndex: 1,
    seekTo: 18
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

async function main() {
  console.log('Starting headless Chrome on port', DEBUG_PORT);
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
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  chrome.on('error', (err) => console.error('Chrome error:', err));

  try {
    await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    console.log('Chrome CDP ready!');

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

    for (const tc of testCases) {
      console.log(`\n========================================`);
      console.log(`Testing: ${tc.title}`);
      await client.send('Page.navigate', { url: `http://localhost:3000/watch/${tc.id}` });

      // Wait until video element is rendered and ready
      console.log('Waiting for video element and stream...');
      let ready = false;
      for (let i = 0; i < 15; i++) {
        await sleep(1000);
        const evalRes = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const v = document.querySelector('video');
              if (!v) return null;
              return { readyState: v.readyState, paused: v.paused, src: v.src, error: v.error ? v.error.message : null };
            })()
          `,
          returnByValue: true
        });
        const val = evalRes.result?.value;
        if (val) {
          console.log(`Video status [sec ${i+1}]:`, val);
          if (val.readyState >= 1) {
            ready = true;
            break;
          }
        }
      }

      // If serverIndex > 0, switch server
      if (tc.serverIndex > 0) {
        console.log(`Selecting Server ${tc.serverIndex + 1}...`);
        await client.send('Runtime.evaluate', {
          expression: `
            (async () => {
              // Open menu tabs
              const tabs = Array.from(document.querySelectorAll('#tabs button, .tabs button'));
              const serverTab = tabs.find(b => b.textContent.includes('Server'));
              if (serverTab) serverTab.click();
              await new Promise(r => setTimeout(r, 600));
              const opts = Array.from(document.querySelectorAll('#list button.opt, .list button.opt'));
              if (opts[${tc.serverIndex}]) {
                opts[${tc.serverIndex}].click();
              }
            })()
          `,
          awaitPromise: true
        });
        await sleep(3000);
      }

      // Seek to vivid frame and ensure playback
      console.log(`Seeking to ${tc.seekTo}s for vivid frame...`);
      await client.send('Runtime.evaluate', {
        expression: `
          (async () => {
            const v = document.querySelector('video');
            if (v) {
              v.currentTime = ${tc.seekTo};
              try { await v.play(); } catch {}
            }
          })()
        `,
        awaitPromise: true
      });

      // Wait for playback at the seek position
      for (let i = 0; i < 6; i++) {
        await sleep(1000);
        const stRes = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const v = document.querySelector('video');
              if (!v) return null;
              return { currentTime: v.currentTime, readyState: v.readyState, paused: v.paused, width: v.videoWidth, height: v.videoHeight };
            })()
          `,
          returnByValue: true
        });
        console.log(`Playback:`, stRes.result?.value);
        if (stRes.result?.value && stRes.result?.value.readyState >= 2) break;
      }

      await sleep(1200);

      // Capture screenshot
      console.log('Capturing vivid screenshot...');
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      const imgBuffer = Buffer.from(screenshot.data, 'base64');
      const outPath = path.join(ARTIFACTS_DIR, `${tc.name}.png`);
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`Saved screenshot: ${outPath} (${(imgBuffer.length / 1024).toFixed(1)} KB)`);
    }

    client.close();
    console.log('\nAll vivid screenshots captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
