import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VOICES } from '@/services/elevenlabs';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DREAMLY_VOICE = {
  id: 'dreamly',
  name: 'Dreamly AI',
  description: 'Unlimited magical stories with a warm, gentle voice.',
  isFree: true
};

type Step5VoiceProps = {
  selected: string;
  onSelect: (voiceId: string) => void;
  onNext: () => void;
  onBack: () => void;
  elevenlabsExhausted?: boolean;
};

export function Step5Voice({ selected, onSelect, onNext, onBack, elevenlabsExhausted = false }: Step5VoiceProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Combine Premium (ElevenLabs) and Free (Dreamly)
  const voices = [DREAMLY_VOICE, ...Object.values(VOICES)];

  return (
    <View style={{ flex: 1, flexDirection: 'column' }} aria-label="Voice selection">
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">The Storyteller</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">Who should tell tonight's magical story?</Text>
      </View>

      {/* Scrollable Options */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48, paddingTop: 12 }}
      >
        <View style={{ gap: 16 }}>
          {voices.map((voice, index) => {
            const isSelected = selected === voice.id;

            return (
              <Animated.View 
                key={voice.id}
                entering={FadeInDown.delay(index * 100).duration(600).springify()}
                style={{ paddingHorizontal: 4 }}
              >
                <TouchableOpacity
                  onPress={() => {
                    const isPremium = !('isFree' in voice);
                    if (isPremium && elevenlabsExhausted) return;
                    onSelect(voice.id);
                  }}
                  activeOpacity={(!('isFree' in voice) && elevenlabsExhausted) ? 1 : 0.7}
                  className={`p-6 rounded-[32px] border flex-row items-center transition-all duration-300 active:scale-95 overflow-hidden ${
                    (!('isFree' in voice) && elevenlabsExhausted)
                      ? 'bg-zinc-100 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800 opacity-50'
                      : isSelected 
                        ? 'bg-sky-500 border-sky-300 dark:bg-white dark:border-white scale-105 shadow-lg shadow-sky-200 dark:shadow-none' 
                        : 'bg-white border-sky-100 dark:bg-zinc-900/50 dark:border-zinc-800'
                  }`}
                >
                  <View className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    isSelected ? 'bg-white dark:bg-zinc-200' : 'bg-sky-50 dark:bg-zinc-800'
                  }`}>
                    <Ionicons 
                      name={'isFree' in voice ? 'sparkles' : 'woman'} 
                      size={28} 
                      color={isSelected ? (isDark ? '#0EA5E9' : '#0EA5E9') : (isDark ? '#52525B' : '#0EA5E9')} 
                    />
                  </View>

                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center">
                      <Text className={`text-xl font-bold ${isSelected ? 'text-white dark:text-zinc-950' : 'text-sky-900 dark:text-zinc-200'}`}>
                        {voice.name}
                      </Text>
                      {'isFree' in voice && (
                        <View className="ml-2 px-2 py-0.5 bg-green-500/20 rounded-full border border-green-500/30">
                          <Text className="text-[10px] font-black text-green-600 dark:text-green-400 tracking-widest uppercase">Unlimited</Text>
                        </View>
                      )}
                      {!('isFree' in voice) && (
                        <View className={`ml-2 px-2 py-0.5 rounded-full border ${elevenlabsExhausted ? 'bg-red-500/20 border-red-500/30' : 'bg-sky-500/20 border-sky-500/30'}`}>
                          <Text className={`text-[10px] font-black tracking-widest uppercase ${elevenlabsExhausted ? 'text-red-500 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'}`}>
                            {elevenlabsExhausted ? 'No Credits' : 'Premium'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className={`${isSelected ? 'text-sky-50/80 dark:text-zinc-500' : 'text-sky-600/80 dark:text-zinc-500'} text-sm font-medium mt-1`}>
                      {voice.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      isDark ? 'bg-sky-500/20' : 'bg-white/20'
                    }`}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={24} 
                        color={isDark ? '#0EA5E9' : 'white'} 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-8 pt-4 pb-6 bg-white dark:bg-zinc-950 border-t border-sky-100 dark:border-zinc-800">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!selected}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] transition-all duration-300 active:scale-95 overflow-hidden ${
            selected ? 'bg-sky-500 dark:bg-white shadow-xl shadow-sky-200 dark:shadow-none' : 'bg-sky-100 dark:bg-zinc-800'
          }`}
        >
          <Text className={`text-center text-xl font-bold ${
            selected ? 'text-white dark:text-zinc-950' : 'text-sky-400 dark:text-zinc-600'
          }`}>Generate Magic</Text>
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
