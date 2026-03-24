import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { uploadAudio } from './storage';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const API_KEY = (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '').trim();

export const VOICES = {
  alice: {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    description: 'A warm, engaging educator with a clear voice.',
  }
} as const;

export const DEFAULT_VOICE_ID = VOICES.alice.id;

// Check if ElevenLabs credits are exhausted
export const checkElevenLabsQuota = async (): Promise<boolean> => {
  if (!API_KEY) return true; // No key = exhausted
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': API_KEY },
    });
    if (!res.ok) return true; // Can't check = assume exhausted
    const data = await res.json();
    const remaining = (data.character_limit ?? 0) - (data.character_count ?? 0);
    return remaining <= 100; // Less than 100 chars = effectively exhausted
  } catch {
    return true;
  }
};

export const generateAndSaveAudio = async (storyId: string, text: string, voiceId: string): Promise<string> => {
  if (!API_KEY) return '';

  const filename = `story_${storyId}.mp3`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  // NEW: Handle Dreamly (Free/Unlimited/System) selection directly
  if (voiceId === 'dreamly') {
    return ''; // Returning empty triggers the robust expo-speech fallback in reader.tsx
  }

  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Upgraded to v2 for better compatibility
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || errorData);
      const isQuotaError = errorDetail.toLowerCase().includes('quota') || response.status === 402;
      
      console.warn(`[ElevenLabs Error]: ${errorDetail} (Status: ${response.status})`);
      
      if (isQuotaError) {
        return '';
      }
      
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // 1. Upload to Supabase Storage for multi-device/web persistence (SAVE CREDITS!)
    const cloudUrl = await uploadAudio(storyId, arrayBuffer);
    
    // 2. Handle Local Saving for Offline Support (Mobile)
    if (Platform.OS === 'web') {
      if (cloudUrl) return cloudUrl;
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      return URL.createObjectURL(blob);
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    try {
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (fsError) {
      console.warn('[ElevenLabs] Local save failed:', fsError);
    }

    // Return cloudUrl if possible, otherwise local fileUri
    return cloudUrl || fileUri;
  } catch (error) {
    console.error('ElevenLabs generation failed:', error);
    throw error;
  }
};

export const getLocalAudioUri = async (storyId: string): Promise<string | null> => {
  if (Platform.OS === 'web') return null; // Web doesn't have persistent file storage via FileSystem
  const filename = `story_${storyId}.mp3`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  return fileInfo.exists ? fileUri : null;
};

export const deleteAudio = async (storyId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const filename = `story_${storyId}.mp3`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  } catch (e) {
    console.warn('Failed to delete audio file:', e);
  }
};
