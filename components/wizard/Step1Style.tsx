import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface Step1StyleProps {
  onSelect: (style: string) => void;
  selected: string;
  onNext: () => void;
  onBack: () => void;
}

const STYLES = [
  { id: 'adventure', name: 'Adventure', icon: 'compass', description: 'Exciting quests and discoveries' },
  { id: 'fairytale', name: 'Fairytale', icon: 'color-wand', description: 'Magic, castles and wonders' },
  { id: 'space', name: 'Space', icon: 'rocket', description: 'Stars, planets and galaxies' },
  { id: 'animals', name: 'Animals', icon: 'paw', description: 'Talking friends in the wild' },
];

export const Step1Style: React.FC<Step1StyleProps> = ({ onSelect, selected, onNext, onBack }) => {
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
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">Pick a Story Style</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">What kind of adventure should we go on tonight?</Text>
      </View>

      {/* Scrollable Options */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
      >
        <View style={{ gap: 16 }}>
          {STYLES.map((style) => {
            const isSelected = selected === style.id;
            return (
              <TouchableOpacity
                key={style.id}
                onPress={() => onSelect(style.id)}
                activeOpacity={0.7}
                className={`p-6 rounded-[32px] border flex-row items-center transition-all duration-300 active:scale-95 overflow-hidden ${
                  isSelected 
                    ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white scale-105 shadow-lg shadow-sky-200 dark:shadow-none' 
                    : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
                }`}
              >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${
                  isSelected ? 'bg-white dark:bg-zinc-200' : 'bg-sky-50 dark:bg-zinc-800'
                }`}>
                  <Ionicons 
                    name={style.icon as any} 
                    size={28} 
                    color={isSelected 
                      ? '#0EA5E9' 
                      : (isDark ? '#52525B' : '#0EA5E9')
                    } 
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-xl font-bold ${isSelected ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                    {style.name}
                  </Text>
                  <Text className={`${isSelected ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-1`}>
                    {style.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Custom Option */}
          <TouchableOpacity
            onPress={handleCustomSelect}
            activeOpacity={0.7}
            className={`p-6 rounded-[32px] border flex-row items-center transition-all duration-300 active:scale-95 overflow-hidden ${
              isCustom 
                ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white scale-105 shadow-lg shadow-sky-200 dark:shadow-none' 
                : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800 border-dashed'
            }`}
          >
            <View className={`w-14 h-14 rounded-2xl items-center justify-center ${
              isCustom ? 'bg-white dark:bg-zinc-200' : 'bg-sky-50 dark:bg-zinc-800'
            }`}>
              <Ionicons 
                name="sparkles" 
                size={28} 
                color={isCustom ? '#0EA5E9' : (isDark ? '#52525B' : '#0EA5E9')} 
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className={`text-xl font-bold ${isCustom ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                Custom
              </Text>
              <Text className={`${isCustom ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-1`}>
                Type your own theme
              </Text>
            </View>
          </TouchableOpacity>

          {/* Custom Text Input */}
          {isCustom && (
            <View className="px-2">
              <TextInput
                value={customText}
                onChangeText={handleCustomTextChange}
                placeholder="e.g. Underwater kingdom, Pirate cats..."
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

      <View className="px-8 pt-4 pb-6 bg-white dark:bg-zinc-950 border-t border-sky-100 dark:border-zinc-800">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!isComplete}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] transition-all duration-300 active:scale-95 overflow-hidden ${
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
