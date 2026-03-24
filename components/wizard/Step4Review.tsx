import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { WizardData } from '@/app/wizard';

interface Step4ReviewProps {
  data: WizardData;
  profile?: any;
  onEdit: (step: number) => void;
  onEditOnboarding: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({ data, profile, onEdit, onEditOnboarding, onNext, onBack }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Parse custom values for display
  const displayStyle = data.style.startsWith('custom:') ? data.style.slice(7) : data.style;
  const displayLesson = data.lesson.startsWith('custom:') ? data.lesson.slice(7) : data.lesson;

  return (
    <View style={{ flex: 1, flexDirection: 'column' }} aria-label="Review configuration">
      {/* Fixed Header */}
      <View className="px-8">
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">Ready for Magic?</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-6 font-medium">Review your adventure before we start weaving the story.</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
      >
        <View style={{ gap: 16 }}>
          {/* Kid Profile Card */}
          <View className="bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Kid Profile</Text>
              <Text className="text-zinc-900 dark:text-white text-2xl font-black tracking-tight">{profile?.name || 'Someone Special'}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-zinc-800 items-center justify-center overflow-hidden">
                  {profile?.avatarUri ? (
                    <Image source={{ uri: profile.avatarUri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons 
                      name={(profile?.emoji || 'star') as any} 
                      size={12} 
                      color={isDark ? '#A1A1AA' : '#38BDF8'} 
                    />
                  )}
                </View>
                <Text className="text-sky-600/60 dark:text-zinc-500 text-sm font-medium">{profile?.age || '?'} years old</Text>
              </View>
              <Text className="text-sky-400 dark:text-zinc-600 text-xs font-bold mt-1">
                {data.heroMode === 'child' ? 'Hero of the story' : 'Listening to a new character'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onEditOnboarding} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-2xl active:scale-90 transition-all ml-4"
            >
              <Ionicons name="pencil" size={20} color={isDark ? '#A1A1AA' : '#38BDF8'} />
            </TouchableOpacity>
          </View>

          {/* Style Card */}
          <View className="bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Style</Text>
              <Text className="text-zinc-900 dark:text-white text-2xl capitalize font-black tracking-tight">{displayStyle}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onEdit(1)} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-2xl active:scale-90 transition-all ml-4"
            >
              <Ionicons name="pencil" size={20} color={isDark ? '#A1A1AA' : '#38BDF8'} />
            </TouchableOpacity>
          </View>

          {/* Lesson Card */}
          <View className="bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Lesson</Text>
              <Text className="text-zinc-900 dark:text-white text-2xl capitalize font-black tracking-tight">{displayLesson}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onEdit(2)} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-2xl active:scale-90 transition-all ml-4"
            >
              <Ionicons name="pencil" size={20} color={isDark ? '#A1A1AA' : '#38BDF8'} />
            </TouchableOpacity>
          </View>

          {/* Duration Card */}
          <View className="bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Duration</Text>
              <Text className="text-zinc-900 dark:text-white text-2xl capitalize font-black tracking-tight">{data.length}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onEdit(4)} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-2xl active:scale-90 transition-all ml-4"
            >
              <Ionicons name="pencil" size={20} color={isDark ? '#A1A1AA' : '#38BDF8'} />
            </TouchableOpacity>
          </View>

          {/* Extra Magic Card */}
          <View className="bg-white border-sky-100 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-[32px] p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Extra Magic</Text>
              <Text className="text-zinc-900 dark:text-white text-lg font-medium leading-relaxed italic opacity-80" numberOfLines={2}>
                {data.details || 'None added'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => onEdit(3)} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-2xl active:scale-90 transition-all ml-4"
            >
              <Ionicons name="pencil" size={20} color={isDark ? '#A1A1AA' : '#38BDF8'} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center justify-center p-4 opacity-10">
          <Ionicons name="sparkles" size={56} color={isDark ? '#E4E4E7' : '#0EA5E9'} />
        </View>
      </ScrollView>

      {/* Fixed Buttons */}
      <View className="px-8 pt-4 pb-6 bg-white dark:bg-zinc-950 border-t border-sky-100 dark:border-zinc-800">
        <TouchableOpacity 
          onPress={onNext}
          activeOpacity={0.8}
          className="w-full py-5 rounded-[24px] bg-sky-500 dark:bg-white active:scale-95 transition-all shadow-xl shadow-sky-200 dark:shadow-none"
        >
          <Text className="text-center text-xl font-black text-white dark:text-zinc-950">Create Magic</Text>
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
