import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ChildProfile } from '../../hooks/useOnboarding';

interface Step3Props {
  profile: ChildProfile;
  toggleInterest: (interest: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const INTERESTS = [
  { id: 'space', label: 'Space & Stars', icon: 'rocket' },
  { id: 'animals', label: 'Animals', icon: 'paw' },
  { id: 'magic', label: 'Magic & Fairies', icon: 'sparkles' },
  { id: 'dragons', label: 'Dragons', icon: 'flame' },
  { id: 'nature', label: 'Forests & Nature', icon: 'leaf' },
  { id: 'oceans', label: 'Oceans', icon: 'water' },
  { id: 'dinosaurs', label: 'Dinosaurs', icon: 'bone', provider: 'MaterialCommunityIcons' },
  { id: 'robots', label: 'Robots', icon: 'robot', provider: 'MaterialCommunityIcons' },
];

export default function Step3({ profile, toggleInterest, onNext, onBack }: Step3Props) {
  const { colorScheme } = useColorScheme();
  
  const isComplete = profile.interests.length > 0;

  return (
    <View className="flex-1 overflow-visible" style={{ flex: 1 }}>
      <View className="flex-1 overflow-visible">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">What does {profile.name || 'the dreamer'} love?</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-8 font-medium">Select up to 3 interests to personalize the stories.</Text>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 280, paddingHorizontal: 4 }}
        >
          <View className="flex-row flex-wrap gap-4 pb-10 p-2 overflow-visible">
            {INTERESTS.map((item) => {
              const isSelected = profile.interests.includes(item.id);
              const IconProvider = item.provider === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleInterest(item.id)}
                  activeOpacity={0.6}
                  className={`flex-row items-center px-6 py-4 rounded-full border shadow-sm transition-all duration-300 active:scale-95 ${
                    isSelected 
                      ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white scale-105' 
                      : 'bg-white dark:bg-zinc-900/50 border-sky-50 dark:border-zinc-800 scale-100'
                  }`}
                >
                  <View className="mr-3">
                    <IconProvider 
                      name={item.icon as any} 
                      size={24} 
                      color={isSelected 
                        ? (colorScheme === 'dark' ? '#09090B' : '#FFFFFF') 
                        : (colorScheme === 'dark' ? '#3F3F46' : '#0EA5E9')
                      } 
                    />
                  </View>
                  <Text className={`text-lg font-bold ${isSelected ? 'text-white dark:text-zinc-950' : 'text-sky-700 dark:text-zinc-300'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="h-20 w-full" />
        </ScrollView>
      </View>

      <View className="absolute bottom-10 left-0 right-0 space-y-4 px-2">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!isComplete}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] transition-all duration-300 active:scale-95 ${isComplete ? 'bg-sky-500 dark:bg-white dark:border-none scale-105' : 'bg-sky-100 dark:bg-zinc-800 scale-100'}`}
        >
          <Text className={`text-center text-xl font-bold ${isComplete ? 'text-white dark:text-zinc-950' : 'text-sky-400 dark:text-zinc-600'}`}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onBack}
          activeOpacity={0.6}
          className="w-full py-4 rounded-full active:scale-95 transition-all duration-200"
        >
          <Text className="text-sky-600 dark:text-zinc-500 text-center font-bold text-lg">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
