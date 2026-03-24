import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Safely handle storage for SSR/Node environments
const storage = Platform.OS === 'web' && typeof window === 'undefined'
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : AsyncStorage;

// Only initialize if we have a valid-looking URL (not the placeholder)
const isValidUrl = supabaseUrl.startsWith('http');

if (!isValidUrl) {
  console.warn('Supabase URL is missing or invalid. Check your .env file.');
}

export const supabase = isValidUrl 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: async (name, acquireTimeout, fn) => {
          return await fn();
        },
      },
    })
  : null as any; 

