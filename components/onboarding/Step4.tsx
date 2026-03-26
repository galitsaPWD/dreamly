import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ChildProfile } from '../../hooks/useOnboarding';

interface Step4Props {
  profile: ChildProfile;
  onComplete: () => void;
  onBack: () => void;
  completing: boolean;
}

export default function Step4({ profile, onComplete, onBack, completing }: Step4Props) {
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-1" style={{ flex: 1 }}>
      <View className="flex-1 justify-center items-center w-full">
        <View className="mb-10 w-32 h-32 bg-white dark:bg-zinc-900/50 rounded-[48px] items-center justify-center border border-sky-100 dark:border-zinc-800/80 overflow-hidden">
          <Ionicons 
            name={(profile.emoji || 'moon-outline') as any} 
            size={72} 
            color={colorScheme === 'dark' ? '#FEF3C7' : '#0EA5E9'} 
          />
        </View>
        
        <Text className="text-sky-900 dark:text-white text-4xl font-black text-center mb-4 tracking-tight">You're all set!</Text>
        <Text className="text-sky-600 dark:text-zinc-400 text-xl text-center px-8 leading-relaxed font-medium">
          We've created a profile for {profile.name}. Ready to dive into your first story?
        </Text>
      </View>
      <View className="absolute bottom-10 left-0 right-0 space-y-4">
        <TouchableOpacity 
          onPress={onComplete}
          activeOpacity={0.8}
          disabled={completing}
          className="w-full bg-sky-500 dark:bg-white py-5 rounded-[24px] active:scale-95 transition-all duration-200 justify-center items-center overflow-hidden"
        >
          {completing ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#FFF'} />
          ) : (
            <Text className="text-white dark:text-zinc-950 text-xl font-bold text-center">Read your first story</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onBack}
          activeOpacity={0.6}
          className="w-full py-4 bg-transparent rounded-full active:scale-95 transition-all duration-200"
        >
          <Text className="text-sky-600 dark:text-zinc-500 text-center font-bold text-lg">Change something</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
