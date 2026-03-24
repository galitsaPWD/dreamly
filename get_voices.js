async function getVoices() {
  const API_KEY = "sk_556d87eb26eb2fbd5619c94cf075e74166a267eb8df1cd16";
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': API_KEY }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  }
}
getVoices();
