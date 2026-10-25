import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9877',
  '--disable-gpu',
  '--no-first-run'
]);

async function run() {
  await new Promise(r => setTimeout(r, 1500));
  try {
    const listRes = await fetch('http://127.0.0.1:9877/json/list');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

    await new Promise(res => { ws.onopen = res; });
    ws.send(JSON.stringify({
      id: 1,
      method: 'Page.navigate',
      params: { url: 'http://localhost:3000/watch/01fd5a72-50b7-4a89-a482-70efbc6abb7a' }
    }));

    await new Promise(r => setTimeout(r, 4500));

    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const v = document.querySelector('video');
            return JSON.stringify({
              src: v?.src,
              duration: v?.duration,
              currentTime: v?.currentTime,
              readyState: v?.readyState,
              error: v?.error ? v.error.message : null
            });
          })()
        `,
        returnByValue: true
      }
    }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 2) {
        console.log('VIDEO RESULT IN CHROME:', data.result);
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}

run();
