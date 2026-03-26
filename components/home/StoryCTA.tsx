import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { ChildProfile } from '@/hooks/useOnboarding';

interface StoryCTAProps {
  onPress: () => void;
  profile?: ChildProfile | null;
}

export const StoryCTA: React.FC<StoryCTAProps> = ({ onPress, profile }) => {
  const { colorScheme } = useNativeWindColorScheme();
  const isDark = colorScheme === 'dark';

  const gradientColors = isDark
    ? ['#0EA5E9', '#0284C7', '#0369A1'] as const
    : ['#0EA5E9', '#38BDF8', '#818CF8'] as const;

  return (
    <View className="px-6 my-2">
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9}
        className="active:scale-[0.98]"
      >
        <View className="rounded-[32px] overflow-hidden shadow-xl shadow-sky-400/30">
          <LinearGradient
            colors={isDark ? ['#312E81', '#4F46E5'] : ['#0EA5E9', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-8 flex-row items-center border border-white/20 dark:border-white/10"
          >
            <View className="flex-1 pr-4">
              <Text className="text-white text-3xl font-black mb-1 tracking-tighter">
                New Story
              </Text>
              <Text className="text-white/80 text-sm font-bold leading-5">
                Create a magical world for {profile?.name || 'your child'}
              </Text>
            </View>
            
            <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center backdrop-blur-md border border-white/30">
              <Ionicons name="sparkles" size={40} color="white" />
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
};


