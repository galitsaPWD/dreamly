import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface StoryLoadingProps {
  message?: string;
}

export const StoryLoading: React.FC<StoryLoadingProps> = ({ 
  message = "Weaving the threads of your magic story..." 
}) => {
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-1 items-center justify-center p-10">
      <View className="relative mb-12">
        <View className="absolute inset-0 bg-sky-400/30 dark:bg-indigo-500/20 blur-3xl rounded-full" />
        <View 
          style={{ borderRadius: 40, overflow: 'hidden' }}
          className="bg-white dark:bg-zinc-900 p-8 shadow-xl border border-sky-100 dark:border-zinc-800"
        >
          <Ionicons 
            name="sparkles" 
            size={80} 
            color={colorScheme === 'dark' ? '#A1A1AA' : '#38BDF8'} 
          />
        </View>
      </View>
      
      <View className="items-center max-w-[280px]">
        <Text className="text-zinc-900 dark:text-white text-3xl font-black text-center mb-4 tracking-tight">
          Just a moment
        </Text>
        
        <Text className="text-sky-600 dark:text-zinc-500 text-lg text-center leading-relaxed font-medium italic mb-10 opacity-80">
          {message}
        </Text>

        <View className="flex-row items-center space-x-2">
          <ActivityIndicator size="small" color="#0EA5E9" />
          <Text className="text-sky-400 dark:text-zinc-600 font-bold text-[10px] uppercase tracking-[3px]">
            Magical Weaving
          </Text>
        </View>
      </View>
    </View>
  );
};
