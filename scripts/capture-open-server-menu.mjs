import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9876;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-stream-menu-data');

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
  console.log('Starting headless Chrome for menu capture...');
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

    // 1. Whiplash Server Selection Menu
    console.log('Navigating to Whiplash watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/079491aa-2289-44d0-ad42-3bee13234e9f' });
    await sleep(4000);

    // Seek to 14s and play
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const v = document.querySelector('video');
          if (v) { v.currentTime = 14; v.play().catch(() => {}); }
          const trkBtn = document.getElementById('trk');
          if (trkBtn) trkBtn.click();
          const serverTabs = Array.from(document.querySelectorAll('#tabs button, .tabs button'));
          const serverTab = serverTabs.find(b => b.textContent.includes('Server'));
          if (serverTab) serverTab.click();
        })()
      `
    });
    await sleep(2000);

    console.log('Capturing whiplash_server_selection_menu.png...');
    const s1 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_server_selection_menu.png'), Buffer.from(s1.data, 'base64'));

    // 2. Superbad Server Selection Menu
    console.log('Navigating to Superbad watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/709123d4-0ede-4aa7-a1ed-fdeb2de4fa25' });
    await sleep(4000);

    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const v = document.querySelector('video');
          if (v) { v.currentTime = 15; v.play().catch(() => {}); }
          const trkBtn = document.getElementById('trk');
          if (trkBtn) trkBtn.click();
          const serverTabs = Array.from(document.querySelectorAll('#tabs button, .tabs button'));
          const serverTab = serverTabs.find(b => b.textContent.includes('Server'));
          if (serverTab) serverTab.click();
        })()
      `
    });
    await sleep(2000);

    console.log('Capturing superbad_server_selection_menu.png...');
    const s2 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'superbad_server_selection_menu.png'), Buffer.from(s2.data, 'base64'));

    client.close();
    console.log('Server menu screenshots captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main().catch(console.error);
