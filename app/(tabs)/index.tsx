import React from 'react';
import { ScrollView, View } from 'react-native';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroGreeting } from '@/components/home/HeroGreeting';
import { StoryCTA } from '@/components/home/StoryCTA';
import { RecentStories } from '@/components/home/RecentStories';
import { MagicBackground } from '@/components/home/MagicBackground';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter, useNavigation } from 'expo-router';
import { getStories, SavedStory } from '@/services/storage';

import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const { profile } = useOnboarding();
  const router = useRouter();
  const navigation = useNavigation();
  const [stories, setStories] = React.useState<SavedStory[]>([]);
  const isMounted = React.useRef(true);
  const isLoadingStories = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    const unsubscribe = navigation.addListener('focus', () => {
      loadStories();
    });
    
    loadStories();
    
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [navigation]);

  const loadStories = async () => {
    if (isLoadingStories.current) return;
    isLoadingStories.current = true;
    try {
      // Step 1: Load from local cache immediately
      const { getCachedStories } = await import('@/services/storage');
      const cached = await getCachedStories();
      if (isMounted.current && cached.length > 0) {
        setStories(cached);
      }

      // Step 2: Sync with cloud in background
      const data = await getStories();
      if (isMounted.current) {
        setStories(data);
      }
    } catch (err) {
      console.warn('Failed to fetch stories:', err);
    } finally {
      isLoadingStories.current = false;
    }
  };

  return (
    <MagicBackground>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
          <HomeHeader />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
          <HeroGreeting profile={profile} />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
          <StoryCTA 
            profile={profile}
            onPress={() => router.push('/wizard')} 
          />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
          <RecentStories stories={stories} />
        </Animated.View>
      </ScrollView>
    </MagicBackground>
  );
}
