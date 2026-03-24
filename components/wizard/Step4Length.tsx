import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface Step4LengthProps {
  onSelect: (length: 'short' | 'medium' | 'long') => void;
  selected: string;
  onNext: () => void;
  onBack: () => void;
}

const LENGTHS = [
  { 
    id: 'short' as const, 
    name: 'Quick Dream', 
    duration: '~3 min read',
    icon: 'moon',
    description: 'A short, sweet story to drift off quickly'
  },
  { 
    id: 'medium' as const, 
    name: 'Classic Tale', 
    duration: '~5 min read',
    icon: 'book',
    description: 'The perfect bedtime story length'
  },
  { 
    id: 'long' as const, 
    name: 'Epic Journey', 
    duration: '~10 min read',
    icon: 'planet',
    description: 'A longer adventure for restless nights'
  },
];

export const Step4Length: React.FC<Step4LengthProps> = ({ onSelect, selected, onNext, onBack }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isComplete = selected !== '';

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">How long is the journey?</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">Choose the perfect length for tonight's story.</Text>
      </View>

      {/* Scrollable Options */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
      >
        <View style={{ gap: 16 }}>
          {LENGTHS.map((length) => {
            const isSelected = selected === length.id;
            return (
              <TouchableOpacity
                key={length.id}
                onPress={() => onSelect(length.id)}
                activeOpacity={0.7}
                className={`p-5 rounded-[28px] border flex-row items-center transition-all duration-300 active:scale-95 ${
                  isSelected 
                    ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white shadow-lg shadow-sky-200 dark:shadow-none' 
                    : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
                }`}
              >
                <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-white dark:bg-zinc-200' : 'bg-sky-50 dark:bg-zinc-800'
                }`}>
                  <Ionicons 
                    name={length.icon as any} 
                    size={24} 
                    color={isSelected ? '#0EA5E9' : (isDark ? '#52525B' : '#0EA5E9')} 
                  />
                </View>
                <View className="ml-4 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-xl font-bold ${isSelected ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                      {length.name}
                    </Text>
                    <Text className={`text-xs font-bold ${isSelected ? 'text-sky-100 dark:text-zinc-500' : 'text-sky-400 dark:text-zinc-600'}`}>
                      {length.duration}
                    </Text>
                  </View>
                  <Text className={`${isSelected ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-1`}>
                    {length.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Buttons */}
      <View className="px-8 pt-4 pb-6 bg-white dark:bg-zinc-950 border-t border-sky-100 dark:border-zinc-800">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!isComplete}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] transition-all duration-300 active:scale-95 ${
            isComplete ? 'bg-sky-500 dark:bg-white shadow-xl shadow-sky-200 dark:shadow-none' : 'bg-sky-100 dark:bg-zinc-800'
          }`}
        >
          <Text className={`text-center text-xl font-bold ${
            isComplete ? 'text-white dark:text-zinc-950' : 'text-sky-400 dark:text-zinc-600'
          }`}>Continue</Text>
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
};
