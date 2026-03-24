import React from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SavedStory, identifyAmbientSound } from '@/services/storage';

import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';

interface RecentStoriesProps {
  stories: SavedStory[];
}

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
      animals: { light: ['#FEFCE8', '#FEF9C3'], dark: ['#422006', '#713F12'] },    // Brown-ish
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

export const RecentStories: React.FC<RecentStoriesProps> = ({ stories }) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (stories.length === 0) return null;

  return (
    <View className="px-6 mb-16">
      <View className="flex-row items-center justify-between mb-8 px-4">
        <Text className="text-zinc-900 dark:text-white text-3xl font-black tracking-tighter">
          Recent Stories
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="-mx-6 px-6"
        contentContainerStyle={{ paddingRight: 40, paddingBottom: 20 }}
      >
        {stories.slice(0, 5).map((story) => (
          <TouchableOpacity
            key={story.id}
            onPress={() => router.push({ pathname: '/reader', params: { storyId: story.id } })}
            activeOpacity={0.85}
            className="mr-6"
          >
            <LinearGradient
              colors={getThemeColors(story, isDark)}
              className="p-6 overflow-hidden rounded-[32px] border border-white dark:border-white/10 w-64 shadow-xl shadow-sky-200/30 dark:shadow-none"
            >
              {/* Background Watermark Icon */}
              <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: isDark ? 0.08 : 0.1 }}>
                <Ionicons name={getIconForStory(story)} size={120} color={isDark ? "#FFFFFF" : "#0EA5E9"} />
              </View>

              <Text className="text-zinc-900 dark:text-white text-[22px] font-black mt-2 mb-1.5 tracking-tight leading-tight" numberOfLines={2}>
                {story.title}
              </Text>
              
              <Text className="text-sky-600/70 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-6" numberOfLines={1}>
                {story.childName || 'Dreamer'}
              </Text>
              
              <View className="flex-row items-center justify-between border-t border-sky-100 dark:border-zinc-800/50 pt-5">
                <Text className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                   {new Date(story.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <View className="w-8 h-8 rounded-full bg-sky-500 items-center justify-center shadow-lg shadow-sky-300">
                   <Ionicons name="play" size={14} color="white" className="ml-0.5" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
