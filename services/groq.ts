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

  // Map length to word counts (Calibrated for Short/Medium/Long identity)
  const lengths = {
    short: { words: '300-450', time: '2-3 minutes', paragraphs: '3-4' },
    medium: { words: '800-1000', time: '6-8 minutes', paragraphs: '7-9' },
    long: { words: '1800-2600', time: '12-15 minutes', paragraphs: '15-20' },
  };

  const selectedLength = request.length || 'medium';
  const { words, time, paragraphs } = lengths[selectedLength];

  // Parse custom values (custom:user_text → user_text)
  const style = request.style.startsWith('custom:') ? request.style.slice(7) : request.style;
  const lesson = request.lesson.startsWith('custom:') ? request.lesson.slice(7) : request.lesson;

  const heroInstruction = request.heroMode === 'character'
    ? `The main character should be a NEW fictional character. Tell a classic third-person story. CRITICAL: DO NOT break the fourth wall. DO NOT address ${request.childName} directly. Do NOT say things like "Imagine yourself..." or "Listen closely, ${request.childName}". The child is just a silent listener. Start the story immediately.`
    : `${request.childName} IS the main character of the story. Write the story about ${request.childName}'s adventure! CRITICAL: Start the narrative immediately without any intro or address to ${request.childName}.`;

  const lengthInstruction = selectedLength === 'short'
    ? `DURATION: QUICK story (~3 min, ${words} words). Focus on ONE vivid, high-fidelity scene. Quality must be "Masterpiece" level—evocative and poetic. ${paragraphs} paragraphs.`
    : selectedLength === 'long'
    ? `DURATION: EPIC journey (~12-15 min, at least ${words} words). Quality must be "Masterpiece" level. Divide into 5 Acts of excessive sensory detail. ${paragraphs} paragraphs.`
    : `DURATION: CLASSIC tale (~6-8 min, at least ${words} words). Quality must be "Masterpiece" level. A balanced, poetic, and highly detailed narrative pacing. ${paragraphs} paragraphs.`;

  const prompt = `
    Task: Write a highly personalized, immersive bedtime story for a child.
    
    Child's Name: ${request.childName}
    Age: ${request.age} years old
    Interests: ${request.interests?.join(', ') || 'Magic and adventure'}
    
    Story Style/Theme: ${style}
    Life Lesson: ${lesson}
    Specific Details: ${request.details || 'None'}
    Main Character: ${heroInstruction}
    
    Story Requirements:
    1. ${lengthInstruction}
    2. STYLE: Lyrical, hypnotic, and "uniquely artisanal". Use a "slow-burn" narrative. Describe sensory details—the air, the subtle sounds, the shifting colors.
    3. ANTI-GENERIC: CRITICAL: DO NOT use cliches like "Once upon a time", "Long ago", or "In a land far away". Avoid predictable plot structures. No "happily ever after" summaries.
    4. OPENING: Start mid-action or with a profound, unusual sensory observation (e.g., the taste of a mountain breeze, the sound of a star waking up).
    5. PERSONALIZATION: Weave in ${request.interests?.join(', ')} naturally as fundamental parts of the world, not just mentions.
    6. ENDING: A very slow, hypnotic descent into total peace and sleep. Ensure a "fade to black" feeling.
    7. RULES: Never address the child directly. No markdown. No headers. No lists.
    8. TITLE: A unique masterpiece title (3-7 words). MUST AVOID generic patterns like "The Adventures of..." or "The [Magic Object] of [Name]". Think "Modern Indie Picture Book" titles.

    Respond in this JSON format ONLY:
    {
      "title": "Title here",
      "ambient_sound": "ocean", // Choose one: rain, ocean, forest, fire, magic, space
      "story": "Full story content here"
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
