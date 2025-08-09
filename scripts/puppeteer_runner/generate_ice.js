import puppeteer from 'puppeteer';

// Usage: node generate_ice.js <payload_json>
// payload_json: { sdp: "...", iceServers: [ {urls:...}, ... ] }

function parseArgs() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Missing payload JSON argument');
    process.exit(2);
  }
  try {
    const obj = JSON.parse(arg);
    if (!obj || typeof obj.sdp !== 'string') throw new Error('payload.sdp required');
    if (!Array.isArray(obj.iceServers)) obj.iceServers = [];
    return obj;
  } catch (e) {
    console.error('Invalid payload JSON:', e.message);
    process.exit(2);
  }
}

const payload = parseArgs();

const html = `<!doctype html><html><body><script>
  (async () => {
    try {
      const offer = { type: 'offer', sdp: ${JSON.stringify(payload.sdp)} };
      const iceServers = ${JSON.stringify(payload.iceServers)};
      const pc = new RTCPeerConnection({ iceServers });
      let firstCandidate = null;
      pc.onicecandidate = (ev) => {
        if (ev.candidate && !firstCandidate) {
          firstCandidate = {
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex
          };
          window.__RESULT__ = { ok: true, candidate: firstCandidate };
        }
      };
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // If no candidate arrived within timeout, return null candidate
      setTimeout(() => {
        if (!window.__RESULT__) window.__RESULT__ = { ok: true, candidate: { candidate: null } };
      }, 2500);
    } catch (e) {
      window.__RESULT__ = { ok: false, error: String(e) };
    }
  })();
<\/script></body></html>`;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const result = await page.waitForFunction('window.__RESULT__ !== undefined', { timeout: 5000 });
  const data = await page.evaluate('window.__RESULT__');
  if (!data || !data.ok) {
    console.error('Puppeteer ICE error:', data && data.error);
    process.exit(3);
  }
  process.stdout.write(JSON.stringify(data.candidate || { candidate: null }));
} finally {
  await browser.close();
}


