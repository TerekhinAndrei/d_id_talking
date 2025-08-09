import puppeteer from 'puppeteer';

// Usage: node generate_sdp.js <offer_sdp_json>
// offer_sdp_json: JSON string { sdp: "..." }

function parseArgs() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Missing offer JSON argument');
    process.exit(2);
  }
  try {
    const obj = JSON.parse(arg);
    if (!obj || typeof obj.sdp !== 'string') throw new Error('bad');
    return obj.sdp;
  } catch (e) {
    console.error('Invalid offer JSON:', e.message);
    process.exit(2);
  }
}

function chunkPrint(label, text) {
  const MAX = 240;
  console.error(label + ': ' + (text.length > MAX ? text.slice(0, MAX) + '...' : text));
}

const offerSdp = parseArgs();

const html = `<!doctype html><html><body><script>
  (async () => {
    try {
      const offer = { type: 'offer', sdp: ${JSON.stringify(offerSdp)} };
      const pc = new RTCPeerConnection();
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const sdp = pc.localDescription.sdp;
      window.__RESULT__ = { sdp, ok: true };
    } catch (e) {
      window.__RESULT__ = { ok: false, error: String(e) };
    }
  })();
<\/script></body></html>`;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  // wait for result
  const result = await page.waitForFunction('window.__RESULT__ !== undefined', { timeout: 5000 });
  const data = await page.evaluate('window.__RESULT__');
  if (!data || !data.ok) {
    console.error('Puppeteer SDP error:', data && data.error);
    process.exit(3);
  }
  // Print pure SDP to stdout
  process.stdout.write(data.sdp);
} finally {
  await browser.close();
}


