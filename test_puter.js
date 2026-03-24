const puterModule = require('@heyputer/puter.js');
const puter = puterModule.puter || puterModule;

async function testPuter() {
    try {
        console.log('Requesting TTS from Puter.js...');
        const result = await puter.ai.txt2speech("This is a test of Puter ElevenLabs integration.", {
            provider: "elevenlabs",
            voice: "21m00Tcm4TlvDq8ikWAM", // Rachel
            model: "eleven_multilingual_v2"
        });
        
        console.log('Result Type:', typeof result);
        console.log('Result Keys:', Object.keys(result || {}));
        
        if (result && result.src) {
            console.log('Audio Source:', result.src);
        }
        
    } catch (error) {
        console.error('Puter TTS Failed:', error.message || error);
    }
}

testPuter();
