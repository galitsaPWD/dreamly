import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface Step2LessonProps {
  onSelect: (lesson: string) => void;
  selected: string;
  onNext: () => void;
  onBack: () => void;
}

const LESSONS = [
  { id: 'kindness', name: 'Kindness', description: 'Being helpful and caring to others' },
  { id: 'bravery', name: 'Bravery', description: 'Finding courage in difficult times' },
  { id: 'honesty', name: 'Honesty', description: 'Understanding why we tell the truth' },
  { id: 'sharing', name: 'Sharing', description: 'Magic of giving and playing together' },
  { id: 'curiosity', name: 'Curiosity', description: 'Learning and asking big questions' },
];

export const Step2Lesson: React.FC<Step2LessonProps> = ({ onSelect, selected, onNext, onBack }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isCustom = selected.startsWith('custom:');
  const [customText, setCustomText] = useState(isCustom ? selected.slice(7) : '');
  const isComplete = selected !== '' && (!isCustom || customText.trim().length > 0);

  const handleCustomSelect = () => {
    onSelect(`custom:${customText}`);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onSelect(`custom:${text}`);
  };

  return (
    <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">Choose a Lesson</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">Every story has a message. What should it be?</Text>
      </View>

      {/* Scrollable Options */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
      >
        <View style={{ gap: 12 }}>
          {LESSONS.map((lesson) => {
            const isSelected = selected === lesson.id;
            return (
              <TouchableOpacity
                key={lesson.id}
                onPress={() => onSelect(lesson.id)}
                activeOpacity={0.7}
                className={`p-6 rounded-2xl border transition-all duration-300 active:scale-95 ${
                  isSelected 
                    ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white shadow-lg shadow-sky-200 dark:shadow-none' 
                    : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
                }`}
              >
                <Text className={`text-xl font-bold ${isSelected ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                  {lesson.name}
                </Text>
                <Text className={`${isSelected ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-0.5`}>
                  {lesson.description}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom Option */}
          <TouchableOpacity
            onPress={handleCustomSelect}
            activeOpacity={0.7}
            className={`p-6 rounded-2xl border flex-row items-center transition-all duration-300 active:scale-95 ${
              isCustom 
                ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white shadow-lg shadow-sky-200 dark:shadow-none' 
                : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800 border-dashed'
            }`}
          >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
              isCustom ? 'bg-white dark:bg-zinc-200' : 'bg-sky-50 dark:bg-zinc-800'
            }`}>
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={isCustom ? '#0EA5E9' : (isDark ? '#52525B' : '#0EA5E9')} 
              />
            </View>
            <View className="flex-1">
              <Text className={`text-xl font-bold ${isCustom ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                Custom
              </Text>
              <Text className={`${isCustom ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-0.5`}>
                Type your own lesson
              </Text>
            </View>
          </TouchableOpacity>

          {/* Custom Text Input */}
          {isCustom && (
            <View className="px-2">
              <TextInput
                value={customText}
                onChangeText={handleCustomTextChange}
                placeholder="e.g. Dealing with a new sibling, Being patient..."
                placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                autoFocus
                className={`bg-white dark:bg-zinc-900/50 border rounded-2xl px-5 py-4 text-lg font-medium text-zinc-900 dark:text-white ${
                  customText.trim() ? 'border-sky-400 dark:border-white' : 'border-sky-200 dark:border-zinc-700'
                }`}
              />
            </View>
          )}
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
