const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export type StoryRequest = {
  childName: string;
  age: string;
  style: string;
  lesson: string;
  details: string;
  length?: 'short' | 'medium' | 'long';
  interests?: string[];
  heroMode?: 'child' | 'character';
};

export type StoryResult = {
  title: string;
  content: string;
  ambient_sound: string;
};

export const generateStory = async (request: StoryRequest): Promise<StoryResult> => {
  if (!API_KEY || API_KEY === 'your_groq_api_key_here') {
    throw new Error('Groq API key is missing. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.');
  }

  // Map length to word counts
  const lengths = {
    short: { words: '500-700', time: '4 minutes' },
    medium: { words: '1200-1500', time: '8 minutes' },
    long: { words: '1800-2600', time: '15 minutes' },
  };

  const selectedLength = request.length || 'medium';
  const { words, time } = lengths[selectedLength];

  // Parse custom values (custom:user_text → user_text)
  const style = request.style.startsWith('custom:') ? request.style.slice(7) : request.style;
  const lesson = request.lesson.startsWith('custom:') ? request.lesson.slice(7) : request.lesson;

  const heroInstruction = request.heroMode === 'character'
    ? `The main character should be a NEW fictional character. Tell a classic third-person story. CRITICAL: DO NOT break the fourth wall. DO NOT address ${request.childName} directly. Do NOT say things like "Imagine yourself..." or "Listen closely, ${request.childName}". The child is just a silent listener. Start the story immediately.`
    : `${request.childName} IS the main character of the story. Write the story about ${request.childName}'s adventure! CRITICAL: Start the narrative immediately without any intro or address to ${request.childName}.`;

  const prompt = `
    Task: Write a highly personalized, immersive bedtime story for a child.
    
    Child's Name: ${request.childName}
    Age: ${request.age} years old
    Interests: ${request.interests?.join(', ') || 'Magic and adventure'}
    
    Story Style/Theme: ${style}
    Life Lesson: ${lesson}
    Specific Details to include: ${request.details || 'None'}
    Main Character: ${heroInstruction}
    
    Story Requirements:
    1. Duration: ${time} read (Strictly ${words} words). Be descriptive, expansive, and immersive.
    2. OPENING: Do NOT use "Once upon a time" or similar generic phrases. Start with a unique, atmospheric hook that immediately pulls them into the "${style}" world.
    3. THEME: The setting, characters, and jargon must perfectly match the "${style}" theme. 
    4. PERSONALIZATION: Integrate the child's interests (${request.interests?.join(', ') || 'Magic and adventure'}) naturally into the environment or as part of the plot.
       - STRICT RULE: NEVER address the reader directly. Do not say "dear listener", do not say "imagine", and do not talk specifically to ${request.childName} about listening. Keep the story strictly in-universe as a pure narrative.
    5. STRUCTURE: For "long" stories, divide the narrative into 3 distinct scenes or chapters to ensure depth and accurate length.
    6. TONE: Warm, calming, and age-appropriate (${request.age} years old).
    7. ENDING: A gentle transition from the ${style} adventure to a state of total peace.
    8. TITLE RULES: 
       - Avoid generic patterns. Be poetic, surprising, and evocative (e.g., "The Boy Who Painted the Wind", "Where the Silver Moon Hides").
       - Each title must feel like a unique masterpiece. 
    9. FORBIDDEN PATTERNS: Do NOT start with "Once upon a time", "In a village...", or "Long ago". Do NOT use the words "adventure", "discovery", "mystical", or "magical" in the title.
    10. SENSORY OPENING: Start immediately with a specific sensory detail (a sound, a cool breeze, a shimmering light) unique to this story.
    11. DIVERSITY: Use varied, lyrical prose and diverse sentence structures. Avoid repetitive paragraph patterns.

    Respond in this JSON format ONLY:
    {
      "title": "A unique, poetic, storybook-style title (3-7 words)",
      "ambient_sound": "ocean", // MUST be exactly one of: "rain", "ocean", "forest", "fire", "magic", or "space"
      "story": "Full story content here, no headers or markdown formatting"
    }
  `;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 6000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate story');
    }

    const data = await response.json();
    let raw = (data.choices[0].message.content || '').trim();
    
    // Robust JSON extraction
    try {
      // 1. Try direct parse
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        // 2. Try to find JSON block in potential markdown/filler
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw e; // Reroute to legacy fallback
        }
      }

      return {
        title: parsed.title || 'A Magical Story',
        content: parsed.story || parsed.content || raw,
        ambient_sound: parsed.ambient_sound || 'magic'
      };
    } catch (e) {
      console.warn('JSON parsing failed, using legacy fallback:', e);
      // Fallback for non-JSON or malformed responses
      const lines = raw.split('\n').filter((l: string) => l.trim().length > 0);
      
      // If it looks like a JSON block that failed to parse (like the screenshot)
      // try to extract the values manually as a last resort
      const titleMatch = raw.match(/"title":\s*"([^"]+)"/);
      const storyMatch = raw.match(/"story":\s*"([\s\S]+?)"(?=\s*,|\s*\})/);
      const soundMatch = raw.match(/"ambient_sound":\s*"([^"]+)"/);

      if (titleMatch && storyMatch) {
        return {
          title: titleMatch[1],
          content: storyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          ambient_sound: soundMatch ? soundMatch[1] : 'magic'
        };
      }

      const title = lines[0].replace(/^["#*]+|["#*]+$/g, '').trim();
      const content = lines.slice(1).join('\n').trim();
      return { 
        title: title || 'A Magical Story', 
        content: content || raw,
        ambient_sound: 'magic'
      };
    }
  } catch (error) {
    console.error('Groq Story Generation Error:', error);
    throw error;
  }
};
