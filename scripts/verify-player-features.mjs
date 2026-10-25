import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ARTIFACTS_DIR = 'C:/Users/moham_rkwy9b6/.gemini/antigravity/brain/1845d078-695f-4a94-855f-3deaec1d9ae0';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9888;
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-verify-player-data');

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
  console.log('--- Starting Chrome for Player Feature Verification ---');
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

    // TEST 1: Whiplash
    console.log('\n[1/2] Navigating to Whiplash watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/079491aa-2289-44d0-ad42-3bee13234e9f' });
    await sleep(4500);

    // Evaluate player state
    const evalResult1 = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const v = document.querySelector('video');
          const timeLabel = document.querySelector('.seekrow div')?.textContent || document.getElementById('rem')?.textContent;
          const audioBtn = document.querySelector('.btn-audio-vlc')?.textContent;
          const title = document.getElementById('ti')?.textContent;
          const speed = document.getElementById('spd')?.textContent;
          return {
            videoSrc: v ? v.src : '',
            paused: v ? v.paused : true,
            currentTime: v ? v.currentTime : 0,
            duration: v ? v.duration : 0,
            timeLabel,
            audioBtn,
            title,
            speed
          };
        })()
      `
    });
    console.log('Player initial state:', evalResult1.value);

    // Test 10s Forward and Backward
    console.log('Testing +10s Forward...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const fwd = document.getElementById('fwd');
          if (fwd) fwd.click();
        })()
      `
    });
    await sleep(800);

    const fwdCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const osd = document.querySelector('.osd-banner')?.textContent;
          const timeLabel = document.querySelector('.seekrow div')?.textContent;
          return { osd, timeLabel };
        })()
      `
    });
    console.log('+10s result:', fwdCheck.value);

    console.log('Testing -10s Backward...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const back = document.getElementById('back');
          if (back) back.click();
        })()
      `
    });
    await sleep(800);

    const backCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const osd = document.querySelector('.osd-banner')?.textContent;
          const timeLabel = document.querySelector('.seekrow div')?.textContent;
          return { osd, timeLabel };
        })()
      `
    });
    console.log('-10s result:', backCheck.value);

    // Verify Speed Pill in bottom controls
    console.log('Checking Speed Pill in bottom bar...');
    const speedPillCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const pill = document.querySelector('.btn-speed-pill');
          return pill ? { text: pill.textContent.trim(), visible: true } : { visible: false };
        })()
      `
    });
    console.log('Speed pill check:', speedPillCheck.value);

    // Toggle Speed Pill from KB/s to Mb/s
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const pill = document.querySelector('.btn-speed-pill');
          if (pill) pill.click();
        })()
      `
    });
    await sleep(400);

    const speedToggledCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const pill = document.querySelector('.btn-speed-pill');
          return pill ? pill.textContent.trim() : '';
        })()
      `
    });
    console.log('Speed pill toggled:', speedToggledCheck.value);

    // Capture speed pill & bottom controls screenshot
    console.log('Capturing whiplash_vlc_timeline_audio.png with speed pill...');
    const shot1 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_vlc_timeline_audio.png'), Buffer.from(shot1.data, 'base64'));

    // Check loading overlay interactive server selection chips & live speed
    console.log('Verifying loading screen interactive elements...');
    const loadOverlayCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const loadEl = document.querySelector('.load');
          const speedBadge = loadEl ? loadEl.querySelector('.interactive span b')?.textContent : '';
          const serverButtons = loadEl ? Array.from(loadEl.querySelectorAll('.interactive button')).map(b => b.textContent.trim()) : [];
          return { speedBadge, serverButtons };
        })()
      `
    });
    console.log('Loading overlay elements:', loadOverlayCheck.value);

    // Capture loading overlay screenshot showing live speed and quick server selection
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const pp = document.getElementById('pp');
          if (pp) pp.classList.add('loading');
        })()
      `
    });
    await sleep(500);
    const shotLoad = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'loading_screen_with_live_speed_and_servers.png'), Buffer.from(shotLoad.data, 'base64'));
    console.log('Saved loading_screen_with_live_speed_and_servers.png successfully');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const pp = document.getElementById('pp');
          if (pp) pp.classList.remove('loading');
        })()
      `
    });
    await sleep(300);

    // Switch to Server tab to verify Smooth streaming badges
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const trk = document.getElementById('trk');
          if (trk) trk.click();
          const tabs = Array.from(document.querySelectorAll('.tabs button'));
          const sTab = tabs.find(b => b.textContent.includes('Server'));
          if (sTab) sTab.click();
        })()
      `
    });
    await sleep(1000);

    console.log('Capturing whiplash_server_selection.png...');
    const shotServer = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_server_selection.png'), Buffer.from(shotServer.data, 'base64'));

    // TEST Scrubber seeking to 25 minutes
    console.log('Testing scrubber seeking to 25 minutes...');
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const sk = document.getElementById('sk');
          if (sk) {
            const r = sk.getBoundingClientRect();
            const clickEvent = new MouseEvent('pointerdown', {
              clientX: r.left + r.width * 0.25,
              clientY: r.top + r.height / 2,
              bubbles: true
            });
            sk.dispatchEvent(clickEvent);
          }
        })()
      `
    });
    await sleep(2500);

    const seek25Check = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const timeLabel = document.querySelector('.seekrow div')?.textContent;
          return { timeLabel };
        })()
      `
    });
    console.log('Scrubber seek 25m check:', seek25Check.value);

    const shotSeek = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'whiplash_scrubber_seeking_25min.png'), Buffer.from(shotSeek.data, 'base64'));

    // TEST 2: Superbad
    console.log('\n[2/2] Navigating to Superbad watch page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/watch/709123d4-0ede-4aa7-a1ed-fdeb2de4fa25' });
    await sleep(4500);

    // Let video play and test OSD audio toggle
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const audioPill = document.querySelector('.btn-audio-vlc');
          if (audioPill) audioPill.click();
        })()
      `
    });
    await sleep(1200);

    const superbadCheck = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const osd = document.querySelector('.osd-banner')?.textContent;
          const timeLabel = document.querySelector('.seekrow div')?.textContent;
          const audioBtn = document.querySelector('.btn-audio-vlc')?.textContent;
          const speedPill = document.querySelector('.btn-speed-pill')?.textContent?.trim();
          return { osd, timeLabel, audioBtn, speedPill };
        })()
      `
    });
    console.log('Superbad state & OSD:', superbadCheck.value);

    console.log('Capturing superbad_vlc_timeline_audio.png...');
    const shot2 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'superbad_vlc_timeline_audio.png'), Buffer.from(shot2.data, 'base64'));

    client.close();
    console.log('\nAll tests and screenshots completed successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

main().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
