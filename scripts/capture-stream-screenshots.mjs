import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9876;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-stream-test-data');

const movies = [
  { name: 'whiplash_server1_streaming', title: 'Whiplash (Server 1 - 1080p)', id: '079491aa-2289-44d0-ad42-3bee13234e9f', serverIndex: 0 },
  { name: 'whiplash_server2_streaming', title: 'Whiplash (Server 2 - 4K)', id: '079491aa-2289-44d0-ad42-3bee13234e9f', serverIndex: 1 },
  { name: 'taxidriver_server1_streaming', title: 'Taxi Driver (Server 1 - 1080p)', id: '01fd5a72-50b7-4a89-a482-70efbc6abb7a', serverIndex: 0 },
  { name: 'superbad_server1_streaming', title: 'Superbad (Server 1 - 1080p)', id: '709123d4-0ede-4aa7-a1ed-fdeb2de4fa25', serverIndex: 0 },
  { name: 'superbad_server2_streaming', title: 'Superbad (Server 2 - 4K)', id: '709123d4-0ede-4aa7-a1ed-fdeb2de4fa25', serverIndex: 1 },
  { name: 'shaolin_soccer_streaming', title: 'Shaolin Soccer (1080p)', id: 'b3dc56e1-f536-431f-af9c-3a9f52036bc7', serverIndex: 0 }
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
  console.log('Starting headless Chrome with CDP on port', DEBUG_PORT);
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

  chrome.on('error', (err) => console.error('Chrome spawn error:', err));

  try {
    await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    console.log('Chrome CDP is ready on port', DEBUG_PORT);

    // Get the initial page target
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const tabs = await listRes.json();
    const mainTab = tabs.find(t => t.type === 'page') || tabs[0];
    if (!mainTab) throw new Error('No page tab found in Chrome');

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

    for (const item of movies) {
      console.log(`\n========================================`);
      console.log(`Testing: ${item.title}`);
      const targetUrl = `http://localhost:3000/watch/${item.id}`;
      console.log(`Navigating to: ${targetUrl}`);

      await client.send('Page.navigate', { url: targetUrl });
      await sleep(4000);

      // If serverIndex > 0, switch server
      if (item.serverIndex > 0) {
        console.log(`Switching to Server ${item.serverIndex + 1}...`);
        await client.send('Runtime.evaluate', {
          expression: `
            (async () => {
              const serverTabs = Array.from(document.querySelectorAll('#tabs button, .tabs button'));
              const serverTab = serverTabs.find(b => b.textContent.includes('Server'));
              if (serverTab) serverTab.click();
              await new Promise(r => setTimeout(r, 500));
              const serverOpts = Array.from(document.querySelectorAll('#list button.opt, .list button.opt'));
              if (serverOpts[${item.serverIndex}]) {
                serverOpts[${item.serverIndex}].click();
              }
            })()
          `,
          awaitPromise: true
        });
        await sleep(3500);
      }

      // Check video playback status and ensure it's playing
      let isPlaying = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const evalRes = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const v = document.querySelector('video');
              if (!v) return { found: false };
              if (v.paused) v.play().catch(() => {});
              return {
                found: true,
                src: v.src,
                currentSrc: v.currentSrc,
                currentTime: v.currentTime,
                duration: v.duration,
                paused: v.paused,
                readyState: v.readyState,
                error: v.error ? { code: v.error.code, message: v.error.message } : null,
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight
              };
            })()
          `,
          returnByValue: true
        });

        const vInfo = evalRes.result?.value;
        console.log(`Playback Status [attempt ${attempt+1}]:`, vInfo);

        if (vInfo && vInfo.currentTime > 0.5 && !vInfo.error) {
          console.log(`Streaming smoothly! Current time: ${vInfo.currentTime.toFixed(2)}s`);
          isPlaying = true;
          break;
        }
        await sleep(1500);
      }

      // Wait 1.5 seconds for active frames to render
      await sleep(1500);

      // Capture screenshot
      console.log('Capturing screenshot...');
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      const imgBuffer = Buffer.from(screenshot.data, 'base64');
      const outPath = path.join(ARTIFACTS_DIR, `${item.name}.png`);
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`Saved screenshot to: ${outPath} (${(imgBuffer.length / 1024).toFixed(1)} KB)`);
    }

    client.close();
    console.log('\nAll movie screenshots captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
