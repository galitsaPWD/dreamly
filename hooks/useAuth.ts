import React, { useEffect, useState, createContext, useContext } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { getProfile, UserProfile } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  profile: UserProfile | null;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  setProfile: (value: UserProfile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  profile: null,
  isOnboarded: false,
  setIsOnboarded: () => {},
  setProfile: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refreshProfile = async (userId?: string) => {
    try {
      const activeId = userId || user?.id;
      if (!activeId) return;

      const data = await getProfile(activeId);
      
      if (data) {
        setProfile(data);
        
        // STICKY ONBOARDING: Once you are onboarded, we don't let it revert!
        // This prevents redirection loops if the cloud sync is slightly behind.
        if (data.onboardingCompleted) {
          setIsOnboarded(true);
        } else {
          // Only set to false if we haven't already marked them as true in this session
          setIsOnboarded(prev => prev || data.onboardingCompleted);
        }
      }
    } catch (err) {
      console.error('Refresh Profile Error:', err);
    }
  };

  useEffect(() => {
    // FAIL-SAFE: Ensure loading always clears within 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
      setInitialized(true);
    }, 5000);

    if (supabase) {
      const initAuth = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await refreshProfile(session.user.id);
          }
        } catch (err) {
          console.error('Initial Auth check failed:', err);
        } finally {
          setLoading(false);
          setInitialized(true);
          clearTimeout(timeout);
        }
      };

      initAuth();

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        // Update user state immediately
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Trigger story migration in background
          const { migrateLocalStories } = require('@/services/storage');
          migrateLocalStories(session.user.id).catch(console.warn);

          // If a new sign-in occurred, or we just got a user, refresh profile
          refreshProfile(session.user.id).finally(() => {
            setLoading(false);
            setInitialized(true);
          });
        } else {
          // No user (Sign Out)
          setProfile(null);
          setIsOnboarded(false);
          setLoading(false);
          setInitialized(true);
        }
      });

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }
    
    setLoading(false);
    setInitialized(true);
    clearTimeout(timeout);
  }, []);

  const signOut = async () => {
    try {
      // 1. INSTANT UI UPDATE (Move this to the top!)
      // This ensures the button feels responsive and redirects immediately
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsOnboarded(false);
      
      // 2. BACKGROUND CLEANUP (Don't block the UI)
      // We still want to clear persistence to fix the "refresh" issue
      const performCleanup = async () => {
        try {
          if (supabase) {
            // scope: 'local' is usually very fast
            await supabase.auth.signOut({ scope: 'local' });
          }
          await AsyncStorage.removeItem('dreamly:profile');
        } catch (e) {
          console.warn('Background Cleanup Error:', e);
        }
      };

      performCleanup();
      
      // EXPLICIT NAVIGATION: Don't just wait for the layout listener
      // This is a fail-safe for when the layout logic is complex
      setLoading(false);
      setInitialized(true);
      
      // We use a small delay to ensure the state update is processed
      setTimeout(() => {
        const { router } = require('expo-router');
        router.replace('/login');
      }, 0);
    } catch (err) {
      console.error('Logout Fatal Error:', err);
      // Ensure we are at least logged out in memory
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsOnboarded(false);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, session, loading, initialized, profile, isOnboarded, setIsOnboarded, setProfile, signOut, refreshProfile } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
