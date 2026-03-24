import React from 'react';
import { View, Text } from 'react-native';
import { ChildProfile } from '@/hooks/useOnboarding';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

interface HeroGreetingProps {
  profile: ChildProfile | null;
}

export const HeroGreeting: React.FC<HeroGreetingProps> = ({ profile }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const name = profile?.name || 'Dreamer';

  return (
    <View className="px-8 pt-4 pb-2">
      <View className="mb-1">
        <Text className="text-sky-600 dark:text-sky-450 text-sm font-black uppercase tracking-[5px] mb-4">
          {getGreeting()}
        </Text>
        
        <Text 
          numberOfLines={2}
          className="text-zinc-900 dark:text-white text-[56px] font-black tracking-tighter mb-4 leading-[54px]"
        >
          {name}
        </Text>
        
        <Text className="text-zinc-500 dark:text-zinc-400 text-2xl font-bold tracking-tight opacity-90">
          Ready for another story?
        </Text>
      </View>
      
      <View className="w-16 h-1.5 bg-sky-500/20 dark:bg-white/10 rounded-full my-3" />
    </View>
  );
};
