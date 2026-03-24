import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Buffer } from 'buffer';

const STORIES_KEY = 'dreamly:stories';
const PROFILE_KEY = 'dreamly:profile';

export type UserProfile = {
  childName: string;
  childAge: string;
  interests: string[];
  onboardingCompleted: boolean;
  avatarUrl?: string | null;
  emoji?: string;
};

export type SavedStory = {
  id: string;
  title: string;
  content: string;
  date: string;
  childName: string;
  category?: string;
  ambientSound?: string;
  voiceId?: string;
  audioUri?: string;
};

const getStoriesKey = (userId?: string) => userId ? `dreamly:stories:${userId}` : STORIES_KEY;
const getProfileKey = (userId?: string) => userId ? `dreamly:profile:${userId}` : PROFILE_KEY;

// Simple UUID v4 generator for Supabase compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Profile Storage ---

export const saveProfile = async (profile: UserProfile, userId?: string): Promise<void> => {
  try {
    let activeUserId = userId;
    if (!activeUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      activeUserId = session?.user?.id;
    }

    const profileKey = getProfileKey(activeUserId);

    // 1. ALWAYS save locally first (Instant)
    await AsyncStorage.setItem(profileKey, JSON.stringify(profile));

    // 2. Background sync (Non-blocking)
    if (activeUserId) {
      syncProfileToCloud(activeUserId, profile).catch(e => console.warn('Background save sync failed:', e));
    }
  } catch (error) {
    console.error('Failed to save profile:', error);
    throw error;
  }
};

import * as FileSystem from 'expo-file-system';

export const uploadAvatar = async (uri: string, userId: string): Promise<string> => {
  try {
    let fileExt = 'jpeg';
    let contentType = 'image/jpeg';

    if (uri.includes('data:image/')) {
      const match = uri.match(/data:image\/(\w+);base64/);
      if (match) fileExt = match[1];
      contentType = `image/${fileExt}`;
    } else if (!uri.startsWith('blob:') && uri.includes('.')) {
      fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
    }

    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    
    let arrayBuffer: ArrayBuffer;

    if (uri.startsWith('blob:')) {
      const response = await fetch(uri);
      arrayBuffer = await response.arrayBuffer();
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      arrayBuffer = require('buffer').Buffer.from(base64, 'base64');
    }
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true
      });
      
    if (error) {
      console.error('[Storage] Supabase Avatar Upload Error:', error.message);
      throw error;
    }
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: any) {
    console.error('[Storage] Failed to upload avatar to Supabase:', error.message || error);
    throw error; 
  }
};

async function syncProfileToCloud(userId: string, profile: UserProfile) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      child_name: profile.childName,
      child_age: profile.childAge,
      interests: profile.interests,
      onboarding_completed: profile.onboardingCompleted,
      avatar_url: profile.avatarUrl || null,
      updated_at: new Date().toISOString()
    });
  
  if (error) console.error('[Storage] Profile Cloud Sync Error:', error.message);
}

export const getProfile = async (userId?: string): Promise<UserProfile | null> => {
  try {
    let activeUserId = userId;
    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id;
    }

    const profileKey = getProfileKey(activeUserId);

    // 1. IMMEDIATE LOCAL CHECK (Sync-like)
    const localProfileJson = await AsyncStorage.getItem(profileKey);
    const localProfile: UserProfile | null = localProfileJson ? JSON.parse(localProfileJson) : null;
    
    // If we have a local profile, return it immediately to unblock the UI!
    if (localProfile) {
      // Spawn background sync if we have a user
      if (activeUserId) {
        syncProfileInBackground(activeUserId, profileKey).catch(e => console.warn('Background sync failed:', e));
      }
      
      return localProfile;
    }

    // 2. FALLBACK TO CLOUD (Only if local is empty)
    if (activeUserId) {
      return await fetchProfileFromCloud(activeUserId, profileKey);
    }

    return null;
  } catch (error) {
    console.error('getProfile FATAL:', error);
    return null;
  }
};

// Shared mapping logic
async function mapProfileData(data: any, key: string): Promise<UserProfile> {
  const localProfileJson = await AsyncStorage.getItem(key);
  const localProfile: UserProfile | null = localProfileJson ? JSON.parse(localProfileJson) : null;

  const profile: UserProfile = {
    childName: data.child_name,
    childAge: data.child_age?.toString(),
    interests: data.interests || [],
    onboardingCompleted: data.onboarding_completed,
    avatarUrl: data.avatar_url,
    emoji: data.emoji || localProfile?.emoji || 'star', // Preserve local emoji if cloud doesn't have it
  };
  await AsyncStorage.setItem(key, JSON.stringify(profile));
  return profile;
}

// Helper for cleaning up the main function
async function fetchProfileFromCloud(userId: string, key: string): Promise<UserProfile | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('child_name, child_age, interests, onboarding_completed, avatar_url')
      .eq('id', userId)
      .single()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (data) {
      return mapProfileData(data, key);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('Initial cloud fetch failed:', err.message);
  }
  return null;
}

// Background sync that doesn't block the UI
async function syncProfileInBackground(userId: string, key: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('child_name, child_age, interests, onboarding_completed, avatar_url')
      .eq('id', userId)
      .single();

    if (data && !error) {
      await mapProfileData(data, key);
    }
  } catch (e) {
    // Silently fail background tasks
  }
}

// --- Story Storage ---

export const identifyAmbientSound = (title: string, content: string): string => {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('ocean') || text.includes('sea') || text.includes('waves') || text.includes('beach') || text.includes('water') || text.includes('whale') || text.includes('dolphin')) return 'ocean';
  if (text.includes('rain') || text.includes('storm') || text.includes('thunder') || text.includes('puddle') || text.includes('cloud') || text.includes('wet')) return 'rain';
  if (text.includes('forest') || text.includes('trees') || text.includes('nature') || text.includes('woods') || text.includes('mountain') || text.includes('leaf') || text.includes('garden')) return 'forest';
  if (text.includes('fire') || text.includes('flame') || text.includes('dragon') || text.includes('warm') || text.includes('camp') || text.includes('phoenix') || text.includes('red')) return 'fire';
  if (text.includes('space') || text.includes('star') || text.includes('planet') || text.includes('rocket') || text.includes('moon') || text.includes('galaxy') || text.includes('comet') || text.includes('astronaut')) return 'space';
  return 'magic';
};

export const saveStory = async (story: Omit<SavedStory, 'id' | 'date'>) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const storageKey = getStoriesKey(user?.id);
    
    const newStory: SavedStory = {
      ...story,
      id: generateUUID(),
      date: new Date().toISOString(),
      ambientSound: story.ambientSound || identifyAmbientSound(story.title, story.content),
    };

    // 1. Try cloud first if logged in
    if (user) {
      try {
        const { data, error } = await supabase
          .from('stories')
          .insert([{ 
            title: story.title, 
            content: story.content, 
            category: story.category,
            ambient_sound: newStory.ambientSound,
            voice_id: story.voiceId,
            audio_uri: story.audioUri,
            child_name: story.childName,
            user_id: user.id
          }])
          .select()
          .single();

        if (data && !error) {
          newStory.id = String(data.id);
          newStory.date = data.created_at;
        } else if (error) {
          // Silence noise in console to avoid triggering some dev-tools toasts
        }
      } catch (err) {
      }
    }

    // 2. Cache locally
    const existingStoriesJson = await AsyncStorage.getItem(storageKey);
    const existingStories: SavedStory[] = existingStoriesJson ? JSON.parse(existingStoriesJson) : [];
    const updatedStories = [newStory, ...existingStories.filter(s => String(s.id) !== String(newStory.id))];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStories));
    
    return newStory;
  } catch (error) {
    console.error('Failed to save story:', error);
    throw error;
  }
};

export const getCachedStories = async (): Promise<SavedStory[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const storageKey = getStoriesKey(user?.id);
    const localStoriesJson = await AsyncStorage.getItem(storageKey);
    return localStoriesJson ? JSON.parse(localStoriesJson) : [];
  } catch (e) {
    return [];
  }
};

export const getStories = async (): Promise<SavedStory[]> => {
  try {
    // Use getSession instead of getUser to avoid network calls/toasts when offline
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const storageKey = getStoriesKey(user?.id);

    // 1. Return local cache immediately for speed (Optimistic UI)
    const localStories = await getCachedStories();

    // 2. Fetch from cloud in background/if possible
    if (user) {
      const fetchWithRetry = async (retries = 3, delay = 1500) => {
        for (let i = 0; i < retries; i++) {
          try {
            const result = await supabase
              .from('stories')
              .select('id, title, content, created_at, child_name, category, ambient_sound, voice_id, audio_uri')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            
            if (!result.error) return result;
            
            // If it's a schema cache error (PGRST002), retry after a delay
            if (result.error.code === 'PGRST002' && i < retries - 1) {
              console.log(`[Storage] Schema cache error, retrying (${i + 1}/${retries})...`);
              await new Promise(res => setTimeout(res, delay * (i + 1)));
              continue;
            }
            return result;
          } catch (e: any) {
            // Handle network errors like "Failed to fetch"
            if (i < retries - 1) {
              console.log(`[Storage] Network error, retrying (${i + 1}/${retries})...`, e.message);
              await new Promise(res => setTimeout(res, delay * (i + 1)));
              continue;
            }
            return { data: null, error: e };
          }
        }
        return { data: null, error: { message: 'Max retries reached' } };
      };

      try {
        const { data, error } = await fetchWithRetry() as any;

        if (error) {
          console.error('[Storage] Supabase fetch error:', error);
        }
        
        if (data && !error) {
          const cloudStories: SavedStory[] = data.map((s: any) => ({
            id: String(s.id),
            title: s.title,
            content: s.content,
            date: s.created_at,
            childName: s.child_name || '', 
            category: s.category,
            ambientSound: s.ambient_sound,
            voiceId: s.voice_id,
            audioUri: s.audio_uri,
          }));
          
          // MERGE: 
          // 1. Start with cloud stories
          // 2. Filter out anything the user recently deleted locally (but cloud doesn't know yet)
          const deletedIdsKey = `dreamly:deleted:${user.id}`;
          const deletedIdsJson = await AsyncStorage.getItem(deletedIdsKey);
          const deletedIds: string[] = deletedIdsJson ? JSON.parse(deletedIdsJson) : [];
          
          const filteredCloud = cloudStories.filter(cs => !deletedIds.includes(String(cs.id)));
          
          const merged = [...filteredCloud];
          localStories.forEach((ls: SavedStory) => {
            const isSynced = filteredCloud.some(cs => String(cs.id) === String(ls.id));
            const wasDeleted = deletedIds.includes(String(ls.id));
            if (!isSynced && !wasDeleted) {
               merged.push(ls);
            }
          });

          // FINAL SORT: Ensure newest are always on top (handles potential cloud/local time drift)
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
          return merged;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // Fetch interrupted.
        } else {
          // Use console.log for network failures to avoid triggering UI toasts/overlays
        }
      }
    }

    return localStories;
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    return [];
  }
};

export const migrateLocalStories = async (userId: string): Promise<void> => {
  try {
    const guestKey = STORIES_KEY; // 'dreamly:stories'
    const userKey = getStoriesKey(userId);
    
    const guestStoriesJson = await AsyncStorage.getItem(guestKey);
    if (!guestStoriesJson) return;

    const guestStories: SavedStory[] = JSON.parse(guestStoriesJson);
    if (guestStories.length === 0) return;

    for (const story of guestStories) {
      try {
        // 1. Sync to Cloud
        await supabase
          .from('stories')
          .insert([{ 
            title: story.title, 
            content: story.content, 
            category: story.category,
            ambient_sound: story.ambientSound,
            voice_id: story.voiceId,
            audio_uri: story.audioUri,
            child_name: story.childName,
            user_id: userId
          }]);
      } catch (e) {
        console.warn('Individual story migration failed (skipping):', e);
      }
    }

    // 2. Move locally
    const userStoriesJson = await AsyncStorage.getItem(userKey);
    const userStories: SavedStory[] = userStoriesJson ? JSON.parse(userStoriesJson) : [];
    
    // Merge: Avoid duplicates if they already exist in user storage
    const merged = [...userStories];
    guestStories.forEach(gs => {
      const exists = userStories.some(us => us.title === gs.title && us.content === gs.content);
      if (!exists) merged.push(gs);
    });

    await AsyncStorage.setItem(userKey, JSON.stringify(merged));
    
    await AsyncStorage.removeItem(guestKey);
  } catch (error) {
    console.error('Migration FATAL:', error);
  }
};

export const getStoryById = async (storyId: string): Promise<SavedStory | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    // 1. Check local cache first
    const storageKey = getStoriesKey(user?.id);
    const localStoriesJson = await AsyncStorage.getItem(storageKey);
    const localStories: SavedStory[] = localStoriesJson ? JSON.parse(localStoriesJson) : [];
    const foundLocal = localStories.find(s => String(s.id) === String(storyId));
    
    if (foundLocal) return foundLocal;

    // 2. Fallback to cloud if not in local cache
    if (user) {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        return {
          id: String(data.id),
          title: data.title,
          content: data.content,
          date: data.created_at,
          childName: data.child_name || '',
          category: data.category,
          ambientSound: data.ambient_sound,
          voiceId: data.voice_id,
          audioUri: data.audio_uri,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch story by ID:', error);
    return null;
  }
};

export const updateStory = async (storyId: string, updates: Partial<SavedStory>): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const storageKey = getStoriesKey(user?.id);
    
    // 1. Update local cache
    const storiesJson = await AsyncStorage.getItem(storageKey);
    const stories: SavedStory[] = storiesJson ? JSON.parse(storiesJson) : [];
    const updatedStories = stories.map(s => 
      s.id === storyId ? { ...s, ...updates } : s
    );
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStories));

    // 2. Sync to cloud
    if (user) {
      const cloudUpdates: any = {};
      if (updates.title) cloudUpdates.title = updates.title;
      if (updates.content) cloudUpdates.content = updates.content;
      if (updates.category) cloudUpdates.category = updates.category;
      if (updates.ambientSound) cloudUpdates.ambient_sound = updates.ambientSound;
      if (updates.voiceId) cloudUpdates.voice_id = updates.voiceId;
      if (updates.audioUri) cloudUpdates.audio_uri = updates.audioUri;

      const { error } = await supabase
        .from('stories')
        .update(cloudUpdates)
        .match({ id: storyId, user_id: user.id });
      
      if (error) console.warn('Cloud update deferred:', error.message);
    }
  } catch (error) {
    console.error('Failed to update story:', error);
    throw error;
  }
};

export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const storageKey = getStoriesKey(user?.id);
    
    // 1. Remove from local cache immediately
    const storiesJson = await AsyncStorage.getItem(storageKey);
    const stories: SavedStory[] = storiesJson ? JSON.parse(storiesJson) : [];
    const filtered = stories.filter(s => s.id !== storyId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(filtered));

    // 2. Sync deletion to cloud
    if (user) {
      // Track this deletion locally so getStories doesn't bring it back from cloud
      const deletedIdsKey = `dreamly:deleted:${user.id}`;
      const deletedIdsJson = await AsyncStorage.getItem(deletedIdsKey);
      const deletedIds: string[] = deletedIdsJson ? JSON.parse(deletedIdsJson) : [];
      if (!deletedIds.includes(storyId)) {
        await AsyncStorage.setItem(deletedIdsKey, JSON.stringify([...deletedIds, storyId]));
      }

      // Supabase IDs are often integers, while guest IDs are UUID strings.
      const idToMatch = isNaN(Number(storyId)) ? storyId : Number(storyId);
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .match({ id: idToMatch, user_id: user.id });
      
      if (!error) {
        // Cleanup the deleted track if cloud success
        const updatedDeleted = deletedIds.filter(id => id !== storyId);
        await AsyncStorage.setItem(deletedIdsKey, JSON.stringify(updatedDeleted));
      } else {
        console.warn('Cloud deletion deferred:', error.message);
      }
    }
  } catch (error) {
    console.error('Failed to delete story:', error);
    throw error;
  }
};
// --- Audio Storage (Cloud) ---

export const uploadAudio = async (storyId: string, arrayBuffer: ArrayBuffer): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const filePath = `${user.id}/${storyId}.mp3`;
    
    // Convert ArrayBuffer to Buffer for Supabase upload
    const fileBody = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('story-audio')
      .upload(filePath, fileBody, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.warn('[Storage] Audio upload failed:', uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('story-audio')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('[Storage] uploadAudio catch:', error);
    return null;
  }
};
