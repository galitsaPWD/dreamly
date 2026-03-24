const { WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function testEdgeTTS() {
  const url = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('Connected to Edge TTS');
    
    // 1. Send speech.config
    const timestamp = new Date().toUTCString();
    const configMsg = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
    ws.send(configMsg);

    // 2. Send SSML
    const reqId = uuidv4().replace(/-/g, '');
    const text = 'Hello world! This is a test of Microsoft Edge Text To Speech. It sounds incredibly natural.';
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='en-US-AriaNeural'><prosody rate='0%' pitch='0%'>${text}</prosody></voice></speak>`;
    
    const reqMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}Z\r\nPath:ssml\r\n\r\n${ssml}`;
    ws.send(reqMsg);
  });

  let audioBuffer = Buffer.alloc(0);

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      // The binary payload is: 2 bytes of header size, then the header string, then the audio bytes.
      const headSize = data.readUInt16BE(0);
      const headerStr = data.toString('utf8', 2, 2 + headSize);
      
      if (headerStr.includes('Path:audio')) {
        const audioData = data.slice(2 + headSize);
        audioBuffer = Buffer.concat([audioBuffer, audioData]);
      }
    } else {
      const msg = data.toString('utf8');
      if (msg.includes('Path:turn.end')) {
        console.log('Finished streaming. Saving audio...');
        fs.writeFileSync('edge_test.mp3', audioBuffer);
        console.log('Saved to edge_test.mp3. Length:', audioBuffer.length);
        ws.close();
      }
    }
  });

  ws.on('error', (err) => {
    console.error('Edge TTS Error:', err);
  });
}

testEdgeTTS();
