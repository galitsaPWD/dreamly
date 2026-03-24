import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { MagicBackground } from '@/components/home/MagicBackground';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { getStories, deleteStory, SavedStory, identifyAmbientSound } from '@/services/storage';
import { DeleteModal } from '@/components/common/DeleteModal';

const getIconForStory = (story: SavedStory): keyof typeof Ionicons.glyphMap => {
  // Priority 1: Use the explicit category (Adventure, Space, etc.)
  if (story.category) {
    const style = story.category.startsWith('custom:') ? 'custom' : story.category;
    switch (style) {
      case 'adventure': return 'compass';
      case 'fairytale': return 'color-wand';
      case 'space': return 'rocket';
      case 'animals': return 'paw';
      case 'custom': return 'sparkles';
    }
  }

  // Priority 2: Fallback to ambient sound detection
  const cat = story.ambientSound || identifyAmbientSound(story.title, story.content);
  switch (cat) {
    case 'ocean': return 'water';
    case 'rain': return 'rainy';
    case 'forest': return 'leaf';
    case 'fire': return 'flame';
    case 'space': return 'planet';
    default: return 'sparkles';
  }
};

const getThemeColors = (story: SavedStory, isDark: boolean): readonly [string, string] => {
  // Priority 1: Match the style category colors
  if (story.category) {
    const style = story.category.startsWith('custom:') ? 'custom' : story.category;
    const styleThemes: Record<string, { light: readonly [string, string], dark: readonly [string, string] }> = {
      adventure: { light: ['#F0FDFA', '#CCFBF1'], dark: ['#042F2E', '#134E4A'] }, // Teal
      fairytale: { light: ['#ECFDF5', '#D1FAE5'], dark: ['#064E3B', '#065F46'] }, // Emerald/Teal
      space: { light: ['#F8FAFC', '#F1F5F9'], dark: ['#0F172A', '#1E293B'] },     // Slate/Sky
      animals: { light: ['#FEFCE8', '#FEF9C3'], dark: ['#422006', '#713F12'] },    // Amber-ish
      custom: { light: ['#F0F9FF', '#E0F2FE'], dark: ['#082F49', '#0C4A6E'] },     // Sky-ish
    };
    if (styleThemes[style]) {
      return isDark ? styleThemes[style].dark : styleThemes[style].light;
    }
  }

  // Priority 2: Fallback to ambient sound themes
  const cat = story.ambientSound || identifyAmbientSound(story.title, story.content);
  const themes: Record<string, { light: readonly [string, string], dark: readonly [string, string] }> = {
    ocean: { light: ['#F0F9FF', '#E0F2FE'], dark: ['#082F49', '#0C4A6E'] },
    rain: { light: ['#F0F9FF', '#E0F2FE'], dark: ['#082F49', '#0C4A6E'] },
    forest: { light: ['#F0FDF4', '#DCFBDF'], dark: ['#064E3B', '#065F46'] },
    fire: { light: ['#FFF7ED', '#FFEDD5'], dark: ['#451A03', '#78350F'] },
    space: { light: ['#F0F9FF', '#E0F2FE'], dark: ['#082F49', '#0C4A6E'] },
    magic: { light: ['#F0FDFA', '#CCFBF1'], dark: ['#134E4A', '#0F766E'] },
  };
  const colors = themes[cat] || themes.magic;
  return isDark ? colors.dark : colors.light;
};

export default function LibraryScreen() {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavedStory | null>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStories();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStories = async () => {
    try {
      // Step 1: Load from cache
      const { getCachedStories } = await import('@/services/storage');
      const cached = await getCachedStories();
      setStories(cached);

      // Step 2: Sync and update
      const data = await getStories();
      setStories(data);
    } catch (e) {
      // Silently fail or use stale data
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    
    // 1. Optimistic Update (Remove from UI immediately)
    const targetId = deleteTarget.id;
    setStories((prev: SavedStory[]) => prev.filter((s: SavedStory) => s.id !== targetId));
    setDeleteTarget(null);

    try {
      // 2. Background Deletion
      await deleteStory(targetId);
    } catch (err) {
      console.error('Deletion failed:', err);
      // Optional: Rollback if critical, but for stories, cache-first is usually fine
      // loadStories(); 
    }
  }, [deleteTarget]);

  return (
    <MagicBackground>
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-6 pt-10">
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-zinc-900 dark:text-white text-3xl font-bold">Library</Text>
            <Text className="text-zinc-500 dark:text-zinc-400 text-base mt-0.5">Your magic stories</Text>
          </View>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {stories.length === 0 ? (
            <Animated.View 
              entering={FadeInDown.duration(800).springify()}
              className="mt-12 bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-8 items-center shadow-sm"
            >
              <Text className="text-zinc-900 dark:text-white text-2xl font-black mb-3 text-center tracking-tight">No Stories Yet</Text>
              <Text className="text-sky-600 dark:text-zinc-500 text-center text-base font-medium leading-relaxed px-2">
                Your mystical collection will appear here once you create your first adventure.
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/')}
                activeOpacity={0.8}
                className="mt-8 bg-sky-500 w-full py-4 rounded-full shadow-lg shadow-sky-200 dark:shadow-none flex-row items-center justify-center"
              >
                <Text className="text-white font-bold text-lg mr-2">Create a Story</Text>
                <Ionicons name="sparkles" size={18} color="white" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            stories.map((story, index) => (
              <Animated.View 
                key={story.id} 
                entering={FadeInDown.delay(index * 100).duration(500)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/reader?storyId=${story.id}`)}
                  onLongPress={() => setDeleteTarget(story)}
                  activeOpacity={0.8}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={getThemeColors(story, isDark)}
                    className="p-4 rounded-[24px] border border-white dark:border-white/10 flex-row items-center shadow-lg shadow-sky-200/20 dark:shadow-none"
                  >
                    <View className="w-12 h-12 items-center justify-center -ml-1">
                      <Ionicons name={getIconForStory(story)} size={26} color={isDark ? "#FFFFFF" : "#0EA5E9"} />
                    </View>
                    <View className="ml-5 flex-1 pb-1">
                      <Text className="text-zinc-900 dark:text-white text-lg font-black mb-1.5 tracking-tight" numberOfLines={1}>{story.title}</Text>
                      <Text className="text-sky-700/60 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        {new Date(story.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>


      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={!!deleteTarget}
        storyTitle={deleteTarget?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
    </MagicBackground>
  );
}
