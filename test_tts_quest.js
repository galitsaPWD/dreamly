const https = require('https');

async function testTTSQuest() {
  const text = encodeURIComponent('Hello world! Edge TTS via community proxy.');
  const url = `https://api.tts.quest/v3/voice/edge/en-US-AriaNeural?text=${text}`;

  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
    });
  }).on('error', err => {
    console.error('Error:', err);
  });
}

testTTSQuest();
