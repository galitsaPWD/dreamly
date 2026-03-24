import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImageCropper } from '@/components/common/ImageCropper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding, ChildProfile } from '@/hooks/useOnboarding';
import { useColorScheme } from 'nativewind';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';

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

const DEFAULT_EMOJIS = [
  { id: 'star', icon: 'star', color: '#FACC15' },
  { id: 'moon', icon: 'moon', color: '#7DD3FC' }, // Sky/Cyan
  { id: 'sunny', icon: 'sunny', color: '#FCD34D' },
  { id: 'cloud', icon: 'cloud', color: '#BAE6FD' },
  { id: 'leaf', icon: 'leaf', color: '#4ADE80' },
  { id: 'rocket', icon: 'rocket', color: '#FB7185' },
  { id: 'planet', icon: 'planet', color: '#2DD4BF' }, // Teal
  { id: 'flask', icon: 'flask', color: '#14B8A6' },  // Teal/Cyan
  { id: 'color-wand', icon: 'color-wand', color: '#0EA5E9' }, // Sky
  { id: 'paw', icon: 'paw', color: '#10B981' }   // Emerald
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile, loading } = useOnboarding();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [age, setAge] = useState('5');
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUri || null);
  const [emoji, setEmoji] = useState(profile?.emoji || 'star');
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile && !loading && !avatarUri && !name) {
      setName(profile.name || '');
      setAge(profile.age?.toString() || '5');
      setInterests(profile.interests || []);
      setAvatarUri(profile.avatarUri || null);
      setEmoji(profile.emoji || 'star');
    }
  }, [profile, loading]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery access is needed to upload a photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Use our custom Dreamly cropper instead
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setTempUri(uri);
        setShowCropper(true);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Unable to open gallery.');
    }
  };

  const toggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter(id => id !== interestId));
    } else {
      if (interests.length >= 3) return;
      setInterests([...interests, interestId]);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !age.trim()) return;
    
    const newProfile: ChildProfile = {
      ...(profile as ChildProfile),
      name: name.trim(),
      age: age.trim(),
      interests: interests,
      avatarUri: avatarUri,
      emoji: emoji
    };
    
    await saveProfile(newProfile);
    router.back();
  };

  const isComplete = name.trim().length > 0 && age.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-8 pt-6 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-zinc-900 items-center justify-center active:scale-90 transition-all border border-sky-100 dark:border-zinc-800"
          >
            <Ionicons name="close" size={24} color={isDark ? 'white' : '#0EA5E9'} />
          </TouchableOpacity>
          <Text className="text-zinc-900 dark:text-white text-xl font-black tracking-tight">Profile Edit</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={!isComplete}
            className={`px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-md ${
              isComplete ? 'bg-sky-500' : 'bg-sky-100 dark:bg-zinc-800'
            }`}
          >
            <Text className={`font-black uppercase tracking-widest text-xs ${isComplete ? 'text-white' : 'text-sky-300 dark:text-zinc-500'}`}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-8" 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
        >
          {/* Identity Center */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(800)} 
            style={{ width: '100%', alignItems: 'center', marginTop: 16, marginBottom: 40 }}
          >
            <View className="relative">
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.9}
                style={{ 
                  backgroundColor: avatarUri 
                    ? (isDark ? '#18181B' : '#F0F9FF') 
                    : (DEFAULT_EMOJIS.find(e => e.id === emoji)?.color + (isDark ? '20' : '40')) || '#F0F9FF'
                }}
                className="w-32 h-32 rounded-[48px] items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl"
              >
                {avatarUri ? (
                  <Image 
                    source={{ uri: avatarUri }} 
                    className="w-full h-full" 
                    resizeMode="cover" 
                    onError={() => {
                      console.warn('Avatar image load failed, clearing URI');
                      setAvatarUri(null);
                    }}
                  />
                ) : (
                  <View className="items-center">
                    <Ionicons 
                      name={DEFAULT_EMOJIS.find(e => e.id === emoji)?.icon as any || 'star'} 
                      size={48} 
                      color="white" 
                    />
                  </View>
                )}
                
                {/* Overlay for change hint */}
                <View className="absolute bottom-0 left-0 right-0 py-1 bg-black/40 items-center">
                  <Text className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Change</Text>
                </View>
              </TouchableOpacity>
              
              {avatarUri && (
                <TouchableOpacity 
                  onPress={() => setAvatarUri(null)}
                  className="absolute -top-1 -right-1 w-11 h-11 bg-rose-500 rounded-full items-center justify-center border-4 border-white dark:border-[#09090B] shadow-lg"
                >
                  <Ionicons name="trash-outline" size={18} color="white" />
                </TouchableOpacity>
              )}
              
            </View>
            
            <View style={{ width: '100%', marginTop: 32 }}>
              <Text className="text-sky-600/70 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[3px] mb-3 ml-2 text-center">Or pick a mystical avatar</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 10, gap: 12, paddingVertical: 10 }}
              >
                {DEFAULT_EMOJIS.map((item) => {
                  const isSelected = emoji === item.id && !avatarUri;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setEmoji(item.id);
                        setAvatarUri(null);
                      }}
                      style={{
                        backgroundColor: isSelected 
                          ? (item.color + (isDark ? '40' : '20')) 
                          : (isDark ? '#111111' : '#F8FAFC'),
                        borderColor: isSelected ? item.color : (isDark ? '#27272A' : '#E2E8F0')
                      }}
                      className="w-14 h-14 rounded-2xl items-center justify-center border-2 transition-all"
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={24} 
                        color={isSelected ? 'white' : (isDark ? '#3F3F46' : '#94A3B8')} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ width: '100%', marginTop: 32 }}>
              <Text className="text-sky-600/70 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[3px] mb-3 ml-2">Name of Dreamer</Text>
              <View className="bg-sky-50/50 dark:bg-zinc-900/50 border border-sky-100 dark:border-zinc-800 rounded-[32px] p-2">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Leo"
                  placeholderTextColor={isDark ? '#3F3F46' : '#94A3B8'}
                  className="text-zinc-900 dark:text-white text-3xl font-black px-4 h-16"
                />
              </View>
            </View>
          </Animated.View>

          {/* Growth Section */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ width: '100%', marginBottom: 40 }}>
            <LinearGradient
              colors={isDark ? ['#18181B', '#09090B'] : ['#F0F9FF', '#FFFFFF']}
              className="p-8 rounded-[40px] border border-sky-100/50 dark:border-zinc-800/50 shadow-sm"
            >
              <View className="flex-row justify-between items-end mb-8">
                <View>
                  <Text className="text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Growth Stage</Text>
                  <Text className="text-zinc-900 dark:text-white text-4xl font-black tracking-tight">{age} <Text className="text-lg text-sky-500 dark:text-zinc-500">Years</Text></Text>
                </View>
                <View className="w-12 h-12 bg-sky-500/10 dark:bg-zinc-800 rounded-2xl items-center justify-center">
                  <Ionicons name="calendar-outline" size={24} color={isDark ? '#FFFFFF' : '#0EA5E9'} />
                </View>
              </View>
              
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={2}
                maximumValue={12}
                step={1}
                value={parseInt(age) || 5}
                onValueChange={(value: number) => setAge(value.toString())}
                minimumTrackTintColor={isDark ? '#FFFFFF' : '#0EA5E9'}
                maximumTrackTintColor={isDark ? '#27272A' : '#E0F2FE'}
                thumbTintColor={isDark ? '#FFFFFF' : '#0EA5E9'}
              />
              <View className="flex-row justify-between px-2 mt-2">
                <Text className="text-[10px] font-bold text-sky-200 dark:text-zinc-700">Toddler</Text>
                <Text className="text-[10px] font-bold text-sky-200 dark:text-zinc-700">Pre-teen</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Discovery Section */}
          <Animated.View entering={FadeInDown.delay(300)} style={{ width: '100%' }}>
            <View className="flex-row items-center justify-between mb-6 px-2">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[3px]">World Discovery</Text>
              <Text className="text-[10px] font-bold text-sky-400/50">{interests.length}/3 Selected</Text>
            </View>
            
            <View className="flex-row flex-wrap gap-3">
              {INTERESTS.map((item, idx) => {
                const isSelected = interests.includes(item.id);
                const IconProvider = item.provider === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
                
                return (
                  <Animated.View key={item.id} entering={FadeInRight.delay(idx * 50)}>
                    <TouchableOpacity
                      onPress={() => toggleInterest(item.id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-6 py-4 rounded-[28px] border transition-all duration-300 shadow-sm ${
                        isSelected 
                          ? 'bg-sky-500 border-sky-400 dark:bg-white dark:border-white shadow-sky-200' 
                          : 'bg-white dark:bg-zinc-900 border-sky-50 dark:border-zinc-800'
                      }`}
                    >
                      <IconProvider 
                        name={item.icon as any} 
                        size={20} 
                        color={isSelected 
                          ? (isDark ? '#000' : '#FFF') 
                          : (isDark ? '#71717A' : '#0EA5E9')
                        } 
                        style={{ marginRight: 10 }}
                      />
                      <Text className={`font-black text-sm tracking-tight ${
                        isSelected 
                          ? (isDark ? 'text-zinc-900' : 'text-white') 
                          : 'text-sky-900 dark:text-zinc-300'
                      }`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <ImageCropper
        isVisible={showCropper}
        imageUri={tempUri}
        onCrop={(uri: string) => {
          setAvatarUri(uri);
          setShowCropper(false);
        }}
        onClose={() => setShowCropper(false)}
      />
    </SafeAreaView>
  );
}
