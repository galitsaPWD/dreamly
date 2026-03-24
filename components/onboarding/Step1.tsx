import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import DreamlyLogo from '@/components/ui/DreamlyLogo';

interface Step1Props {
  onNext: () => void;
}

export default function Step1({ onNext }: Step1Props) {
  const { colorScheme } = useColorScheme();
  
  return (
    <View className="flex-1" style={{ flex: 1 }}>
      <View className="flex-1 justify-center items-center w-full">
        <View className="mb-10 items-center justify-center">
          <DreamlyLogo size={100} />
        </View>
        
        <Text className="text-sky-900 dark:text-white text-5xl font-black text-center mb-4 tracking-tight">Dreamly</Text>
        <Text className="text-sky-600 dark:text-zinc-400 text-xl text-center leading-relaxed font-medium px-6">
          Personalized bedtime stories,{"\n"}woven with love and magic.
        </Text>
      </View>
      
      <View className="absolute bottom-10 left-0 right-0">
        <TouchableOpacity 
          onPress={onNext}
          activeOpacity={0.8}
          className="bg-sky-500 dark:bg-white w-full py-5 rounded-[24px] active:scale-95 transition-all duration-200"
        >
          <Text className="text-white dark:text-zinc-950 text-xl font-bold text-center">Let's begin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
