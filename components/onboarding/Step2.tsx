import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Slider from '@react-native-community/slider';
import { ChildProfile, useOnboarding } from '../../hooks/useOnboarding';
import { ImageCropper } from '@/components/common/ImageCropper';

interface Step2Props {
  profile: ChildProfile;
  updateProfile: (updates: Partial<ChildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AVATARS = [
  'moon', 'star', 'rocket', 'sparkles', 'leaf', 'paw', 'book'
];

export default function Step2({ profile, updateProfile, onNext, onBack }: Step2Props) {
  const { colorScheme } = useColorScheme();
  const isComplete = profile.name.trim().length > 0 && profile.age.length > 0;

  const [tempUri, setTempUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const pickImage = async () => {
    console.log('PickImage started, Platform:', Platform.OS);
    try {
      // 1. Permission (Only needed on Native)
      if (Platform.OS !== 'web') {
        process.stdout.write('Checking permissions...\n');
        const current = await ImagePicker.getMediaLibraryPermissionsAsync();
        let status = current.status;
        console.log('Current permission status:', status);
        
        if (status !== 'granted' && current.canAskAgain) {
          console.log('Requesting permissions...');
          const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
          status = result.status;
          console.log('New permission status:', status);
        }

        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery access is needed to upload a photo.');
          return;
        }
      }

      // 2. Launch Library
      console.log('Launching Image Library with ["images"]...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Use our custom Dreamly cropper instead
        quality: 1,
      });

      console.log('Picker Promise Resolved:', !!result);
      console.log('Picker Result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log('Selected URI:', uri);
        setTempUri(uri);
        setShowCropper(true);
      } else {
        console.log('Picker was canceled or no assets returned');
      }
    } catch (error: any) {
      console.error('Gallery Error Full:', error);
      Alert.alert('Unable to open Gallery', `Error: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <View className="flex-1 overflow-visible" style={{ flex: 1 }}>
      <ScrollView className="flex-1 overflow-visible" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
        <Text className="text-sky-900 dark:text-white text-3xl font-black mb-2 tracking-tight">Create a profile</Text>
        <Text className="text-sky-600 dark:text-zinc-500 text-base mb-8 font-medium">Tell us about the little dreamer.</Text>
        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">Profile Picture</Text>
            {profile.avatarUri && (
              <TouchableOpacity onPress={() => updateProfile({ avatarUri: null })} hitSlop={8}>
                <Text className="text-red-400 text-xs font-bold uppercase">Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center gap-6 mb-6">
            <View className="relative">
              <View className="w-24 h-24 rounded-[32px] bg-sky-50 dark:bg-zinc-900 border-2 border-dashed border-sky-300 dark:border-zinc-700 items-center justify-center overflow-hidden">
                {profile.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Ionicons name="image-outline" size={32} color={colorScheme === 'dark' ? '#3F3F46' : '#BAE6FD'} />
                )}
              </View>
              {profile.avatarUri && (
                <TouchableOpacity 
                  onPress={() => updateProfile({ avatarUri: null })} 
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm"
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-1 gap-2">
              <TouchableOpacity 
                onPress={pickImage} 
                className="w-full bg-sky-500 dark:bg-white py-4 rounded-xl items-center justify-center active:scale-95 transition-all shadow-md overflow-hidden"
              >
                <Text className="text-white dark:text-zinc-900 font-bold uppercase tracking-widest">Pick & Crop Photo</Text>
              </TouchableOpacity>
              <Text className="text-sky-600/80 dark:text-zinc-500 text-[10px] leading-relaxed">
                Choose a photo and crop it to a square area.
              </Text>
            </View>
          </View>

          <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Or pick an icon</Text>
          <View className="flex-row flex-wrap gap-4 p-2 overflow-visible">
            {AVATARS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => updateProfile({ emoji: icon })}
                activeOpacity={0.7}
                className={`w-14 h-14 rounded-2xl items-center justify-center border shadow-sm transition-all duration-300 active:scale-90 overflow-hidden ${
                  profile.emoji === icon
                    ? 'bg-sky-500 border-sky-500 dark:bg-white dark:border-white shadow-sky-200 dark:shadow-none scale-110'
                    : 'bg-white border-sky-50 dark:bg-zinc-900/50 dark:border-zinc-800 scale-100'
                }`}
              >
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color={profile.emoji === icon 
                    ? (colorScheme === 'dark' ? '#09090B' : '#FFFFFF') 
                    : (colorScheme === 'dark' ? '#52525B' : '#0EA5E9')
                  } 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="mb-10">
          <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Child's Name</Text>
          <TextInput
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            placeholder="e.g. Liam"
            placeholderTextColor="#94A3B8"
            selectionColor="#0EA5E9"
            className="bg-white border border-sky-100 dark:border-zinc-800 dark:bg-zinc-900/50 text-zinc-900 dark:text-white p-5 rounded-[24px] text-lg font-bold focus:border-sky-500 focus:ring-0 outline-none transition-all overflow-hidden"
            style={{ outline: 'none' } as any}
          />
        </View>
        <View className="mb-12">
          <View className="flex-row justify-between items-end mb-6">
            <Text className="text-sky-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">Age Range</Text>
            <Text className="text-sky-900 dark:text-white text-3xl font-black">{profile.age} <Text className="text-lg font-bold text-sky-500 dark:text-zinc-500">Years</Text></Text>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={2}
            maximumValue={12}
            step={1}
            value={parseInt(profile.age) || 5}
            onValueChange={(value: number) => updateProfile({ age: value.toString() })}
            minimumTrackTintColor={colorScheme === 'dark' ? '#FFFFFF' : '#0EA5E9'}
            maximumTrackTintColor={colorScheme === 'dark' ? '#18181B' : '#E0F2FE'}
            thumbTintColor={colorScheme === 'dark' ? '#FFFFFF' : '#0EA5E9'}
          />
          <View className="flex-row justify-between px-1 mt-2">
            <Text className="text-sky-300 dark:text-zinc-800 font-bold">2</Text>
            <Text className="text-sky-300 dark:text-zinc-800 font-bold">12</Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-0 right-0 space-y-4">
        <TouchableOpacity 
          onPress={onNext}
          disabled={!isComplete}
          activeOpacity={0.8}
          className={`w-full py-5 rounded-[24px] shadow-lg transition-all duration-300 active:scale-95 overflow-hidden ${isComplete ? 'bg-sky-500 shadow-sky-200 dark:bg-white dark:shadow-none scale-105' : 'bg-sky-100 dark:bg-zinc-800 shadow-none scale-100'}`}
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

      <ImageCropper
        isVisible={showCropper}
        imageUri={tempUri}
        onCrop={(uri: string) => {
          console.log('Step2 Cropper yielded URI:', uri);
          updateProfile({ avatarUri: uri });
          setShowCropper(false);
        }}
        onClose={() => setShowCropper(false)}
      />
    </View>
  );
}
