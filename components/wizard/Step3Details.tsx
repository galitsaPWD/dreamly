import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ChildProfile } from '@/hooks/useOnboarding';

interface Step3DetailsProps {
  onChange: (details: string) => void;
  value: string;
  profile?: ChildProfile | null;
  heroMode: 'child' | 'character';
  onHeroModeChange: (mode: 'child' | 'character') => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Details: React.FC<Step3DetailsProps> = ({ onChange, value, profile, heroMode, onHeroModeChange, onNext, onBack }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = React.useState(false);
  
  const addInterest = (interest: string) => {
    const newValue = value ? `${value}, ${interest}` : interest;
    onChange(newValue);
  };

  const isComplete = value.trim().length > 0;

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">Add Special Details</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">Mention names, favorite toys, or a special place you'd like in the story.</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
      >
        {/* Hero Mode Selector */}
        <View className="mb-8">
          <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
            Who's the hero?
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => onHeroModeChange('child')}
              activeOpacity={0.7}
              className={`flex-1 p-4 rounded-2xl border items-center transition-all active:scale-95 ${
                heroMode === 'child'
                  ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white'
                  : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
              }`}
            >
              <Ionicons 
                name="star" 
                size={24} 
                color={heroMode === 'child' ? (isDark ? '#0EA5E9' : '#FFFFFF') : (isDark ? '#52525B' : '#0EA5E9')} 
              />
              <Text className={`text-sm font-bold mt-2 ${
                heroMode === 'child' ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-300'
              }`}>
                {profile?.name || 'My Kid'}
              </Text>
              <Text className={`text-[10px] mt-1 ${
                heroMode === 'child' ? 'text-sky-100 dark:text-zinc-500' : 'text-sky-400 dark:text-zinc-600'
              }`}>
                is the hero
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onHeroModeChange('character')}
              activeOpacity={0.7}
              className={`flex-1 p-4 rounded-2xl border items-center transition-all active:scale-95 ${
                heroMode === 'character'
                  ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white'
                  : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
              }`}
            >
              <Ionicons 
                name="person-add" 
                size={24} 
                color={heroMode === 'character' ? (isDark ? '#0EA5E9' : '#FFFFFF') : (isDark ? '#52525B' : '#0EA5E9')} 
              />
              <Text className={`text-sm font-bold mt-2 ${
                heroMode === 'character' ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-300'
              }`}>
                New Character
              </Text>
              <Text className={`text-[10px] mt-1 ${
                heroMode === 'character' ? 'text-sky-100 dark:text-zinc-500' : 'text-sky-400 dark:text-zinc-600'
              }`}>
                a random hero
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {profile?.interests && profile.interests.length > 0 && (
          <View className="mb-8">
            <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
              {profile.name}'s Interests
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-8 px-8">
              <View className="flex-row pb-2">
                {profile.interests.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => addInterest(interest)}
                    activeOpacity={0.7}
                    className="bg-white border-sky-100 dark:bg-zinc-800 border dark:border-zinc-700 px-5 py-3 rounded-full mr-3 active:scale-95 transition-all"
                  >
                    <Text className="text-sky-700 dark:text-zinc-300 font-bold text-sm tracking-wide">{interest}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View className={`bg-white dark:bg-zinc-900/50 border rounded-[32px] p-6 min-h-[180px] transition-all duration-300 ${
          isFocused 
            ? 'border-sky-400 dark:border-white' 
            : 'border-sky-100 dark:border-zinc-800'
        }`}>
          <TextInput
            multiline
            placeholder="e.g. A friendly dragon named Sparky who loves chocolate chip cookies..."
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="text-zinc-900 dark:text-white text-lg leading-7 h-full"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
        
        <Text className="text-sky-600 dark:text-zinc-600 text-xs mt-6 px-4 italic font-medium">
          The more details you add, the more personalized the magic will be.
        </Text>
      </ScrollView>

      {/* Fixed Buttons */}
      <View className="px-8 pt-4 pb-6 bg-white dark:bg-zinc-950 border-t border-sky-100 dark:border-zinc-800">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!isComplete}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] transition-all duration-300 active:scale-95 ${
            isComplete ? 'bg-sky-500 dark:bg-white scale-105 shadow-xl shadow-sky-200 dark:shadow-none' : 'bg-sky-100 dark:bg-zinc-800'
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
