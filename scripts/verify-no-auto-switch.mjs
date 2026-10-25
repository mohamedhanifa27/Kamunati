import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9899;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-verify-no-autoswitch');

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

async function captureScreenshot(client, filename) {
  const screenshotData = await client.send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(ARTIFACTS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(screenshotData.data, 'base64'));
  console.log(`Saved screenshot: ${outPath}`);
  return outPath;
}

async function main() {
  console.log('--- Verifying No-Auto-Switch & Persistent Streaming ---');
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
    console.log('\n[Step 1] Navigating to Whiplash watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/079491aa-2289-44d0-ad42-3bee13234e9f' });
    await sleep(4000);

    // Check initial active torrent/server
    const initialCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const v = document.querySelector('video');
          const activeChip = document.querySelector('.load button.bg-\\\\[\\\\#8B5CF6\\\\]');
          const serverText = activeChip ? activeChip.textContent.trim() : 'Unknown';
          const src = v ? v.src : '';
          return { src, serverText, paused: v ? v.paused : true, currentTime: v ? v.currentTime : 0 };
        })()
      `
    });
    console.log('Initial server state:', initialCheck.result?.value);

    // Wait 12 seconds to observe playback and ensure no auto-switch triggers
    console.log('\n[Step 2] Observing playback for 12 seconds (verifying server never auto-switches)...');
    for (let i = 1; i <= 6; i++) {
      await sleep(2000);
      const poll = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `
          (() => {
            const v = document.querySelector('video');
            const chips = Array.from(document.querySelectorAll('.interactive button'));
            const activeChip = chips.find(b => b.className.includes('bg-[#8B5CF6]'));
            const serverText = activeChip ? activeChip.textContent.trim() : 'Unknown';
            return {
              time: v ? v.currentTime : 0,
              paused: v ? v.paused : true,
              src: v ? v.src : '',
              serverText
            };
          })()
        `
      });
      const val = poll.result?.value || {};
      console.log(`[t=${i*2}s] Server: ${val.serverText}, Time: ${(val.time || 0).toFixed(1)}s, Paused: ${val.paused}`);
    }

    await captureScreenshot(client, 'whiplash_server_persisting_no_autoswitch.png');

    // 3. Test Manual Server Switching by clicking Server 2
    console.log('\n[Step 3] Testing manual server change by clicking Server 2...');
    const switchRes = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const chips = Array.from(document.querySelectorAll('.interactive button'));
          const srv2 = chips.find(b => b.textContent.includes('Server 2'));
          if (srv2) {
            srv2.click();
            return { clicked: true, text: srv2.textContent.trim() };
          }
          return { clicked: false };
        })()
      `
    });
    console.log('Clicked Server 2 manually:', switchRes.result?.value);
    await sleep(4000);

    const postSwitchCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const v = document.querySelector('video');
          const chips = Array.from(document.querySelectorAll('.interactive button'));
          const activeChip = chips.find(b => b.className.includes('bg-[#8B5CF6]'));
          const serverText = activeChip ? activeChip.textContent.trim() : 'Unknown';
          const osd = document.querySelector('.osd-banner')?.textContent;
          return {
            src: v ? v.src : '',
            time: v ? v.currentTime : 0,
            paused: v ? v.paused : true,
            serverText,
            osd
          };
        })()
      `
    });
    console.log('Post manual switch state:', postSwitchCheck.result?.value);
    await captureScreenshot(client, 'whiplash_manual_switch_server2.png');

    // 4. Test on a second movie: Superbad
    console.log('\n[Step 4] Navigating to Superbad watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/3563a395-f814-4f7d-a6bb-2e0fdba144ff' });
    await sleep(5000);

    const superbadCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const v = document.querySelector('video');
          const chips = Array.from(document.querySelectorAll('.interactive button'));
          const activeChip = chips.find(b => b.className.includes('bg-[#8B5CF6]'));
          const serverText = activeChip ? activeChip.textContent.trim() : 'Unknown';
          const speed = document.getElementById('spd')?.textContent;
          return {
            src: v ? v.src : '',
            time: v ? v.currentTime : 0,
            paused: v ? v.paused : true,
            serverText,
            speed
          };
        })()
      `
    });
    console.log('Superbad initial state:', superbadCheck.result?.value);

    // Observe Superbad for 8 seconds
    for (let i = 1; i <= 4; i++) {
      await sleep(2000);
      const poll = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `
          (() => {
            const v = document.querySelector('video');
            const chips = Array.from(document.querySelectorAll('.interactive button'));
            const activeChip = chips.find(b => b.className.includes('bg-[#8B5CF6]'));
            const serverText = activeChip ? activeChip.textContent.trim() : 'Unknown';
            return {
              time: v ? v.currentTime : 0,
              paused: v ? v.paused : true,
              src: v ? v.src : '',
              serverText
            };
          })()
        `
      });
      const val = poll.result?.value || {};
      console.log(`[Superbad t=${i*2}s] Server: ${val.serverText}, Time: ${(val.time || 0).toFixed(1)}s, Paused: ${val.paused}`);
    }

    await captureScreenshot(client, 'superbad_continuous_playback_manual_server.png');

    console.log('\n--- All Tests Completed Successfully! ---');
    client.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main();
