import { useAuth } from '@/hooks/useAuth';
import { saveProfile, UserProfile } from '@/services/storage';

export type ChildProfile = {
  name: string;
  age: string;
  emoji: string;
  interests: string[];
  avatarUri?: string | null;
};

export function useOnboarding() {
  const { profile: authProfile, isOnboarded, loading, refreshProfile, setIsOnboarded, setProfile: setGlobalProfile, user } = useAuth();

  const profile: ChildProfile | null = authProfile ? {
    name: authProfile.childName,
    age: authProfile.childAge,
    emoji: authProfile.emoji || 'star',
    interests: authProfile.interests || [],
    avatarUri: authProfile.avatarUrl,
  } : null;

  const completeOnboarding = async (newProfile: ChildProfile) => {
    try {
      let finalAvatarUrl = newProfile.avatarUri;

      // 0. UPLOAD AVATAR (if local or blob)
      if (finalAvatarUrl && (finalAvatarUrl.startsWith('file://') || finalAvatarUrl.startsWith('blob:')) && user?.id) {
        try {
          const { uploadAvatar } = await import('@/services/storage');
          finalAvatarUrl = await uploadAvatar(finalAvatarUrl, user.id);
          console.log('Successfully uploaded avatar to:', finalAvatarUrl);
        } catch (e) {
          console.warn('Silent avatar upload fail (clearing local reference to prevent dead blobs):', e);
          finalAvatarUrl = null; // Clear it so we don't save a dead blob URI
        }
      }

      const storageProfile: UserProfile = {
        childName: newProfile.name,
        childAge: newProfile.age,
        interests: newProfile.interests,
        onboardingCompleted: true,
        avatarUrl: finalAvatarUrl || undefined,
        emoji: newProfile.emoji
      };
      
      // 1. IMMEDIATE STATE SYNC (Ultra-Optimistic)
      // We do this FIRST to unblock navigation guards
      setIsOnboarded(true);
      setGlobalProfile(storageProfile);

      // 2. Save in background
      // Use the ID we already have to skip network calls in saveProfile
      saveProfile(storageProfile, user?.id).catch(e => console.error('Onboarding save failed:', e));
      
      // 3. Background background sync (non-blocking)
      refreshProfile().catch(e => console.warn('Background sync failed:', e)); 
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      // Logic for reset could be added to storage.ts if needed
      await refreshProfile();
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  return {
    isOnboarded,
    profile,
    loading,
    completeOnboarding,
    saveProfile: completeOnboarding,
    resetOnboarding,
  };
}
