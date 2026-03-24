const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function testEdgeTTSWithHeaders() {
  const url = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  
  const ws = new WebSocket(url, [], {
    headers: {
      'Origin': 'chrome-extension://jdiccldimpdaepmoblpebfbofmhiedmi',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
    }
  });
  
  ws.on('open', () => {
    console.log('Connected to Edge TTS with headers!');
    const timestamp = new Date().toUTCString();
    ws.send(`X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`);

    const reqId = uuidv4().replace(/-/g, '');
    const text = 'This proves we bypassed the 403 Forbidden without a custom backend proxy!';
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='en-US-AriaNeural'><prosody rate='0%' pitch='0%'>${text}</prosody></voice></speak>`;
    
    ws.send(`X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}Z\r\nPath:ssml\r\n\r\n${ssml}`);
  });

  let audioBuffer = Buffer.alloc(0);

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      const headSize = data.readUInt16BE(0);
      const headerStr = data.toString('utf8', 2, 2 + headSize);
      if (headerStr.includes('Path:audio')) {
        audioBuffer = Buffer.concat([audioBuffer, data.slice(2 + headSize)]);
      }
    } else {
      const msg = data.toString('utf8');
      if (msg.includes('Path:turn.end')) {
        fs.writeFileSync('edge_bypassed.mp3', audioBuffer);
        console.log('Success! Saved Edge TTS Audio bypassing 403! Buffer length:', audioBuffer.length);
        ws.close();
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
  });
}

testEdgeTTSWithHeaders();
