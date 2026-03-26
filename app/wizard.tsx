import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useOnboarding } from '@/hooks/useOnboarding';
import { MagicBackground } from '@/components/home/MagicBackground';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Step1Style } from '@/components/wizard/Step1Style';
import { Step2Lesson } from '@/components/wizard/Step2Lesson';
import { Step3Details } from '@/components/wizard/Step3Details';
import { Step4Length } from '@/components/wizard/Step4Length';
import { Step4Review } from '@/components/wizard/Step4Review';
import { StoryLoading } from '@/components/common/StoryLoading';

export type WizardData = {
  style: string;
  lesson: string;
  details: string;
  length: 'short' | 'medium' | 'long';
  heroMode: 'child' | 'character';
  voiceId: string;
};

export default function WizardScreen() {
  const [step, setStep] = useState(1);
  const [voiceId, setVoiceId] = useState('Xb7hH8MSUJpSbSDYk0k2');
  const [data, setData] = useState<WizardData>({
    style: '',
    lesson: '',
    details: '',
    length: 'medium',
    heroMode: 'child',
    voiceId: 'ZEt85AU1ui8Rr8FxNslW', // Default to Rose (Alice)
  });
  const { profile } = useOnboarding();
  const [isGenerating, setIsGenerating] = useState(false);
  const isMounted = React.useRef(true);
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [loadingMessage, setLoadingMessage] = useState("Weaving the threads of your magic story...");
  const [elevenlabsExhausted, setElevenlabsExhausted] = useState(false);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (step === 5) {
      import('@/services/elevenlabs').then(({ checkElevenLabsQuota }) => {
        checkElevenLabsQuota().then(exhausted => {
          if (isMounted.current) {
            setElevenlabsExhausted(exhausted);
            // If they had a premium voice selected but it's exhausted, fallback to Dreamly
            if (exhausted && data.voiceId !== 'dreamly') {
              setData(prev => ({ ...prev, voiceId: 'dreamly' }));
            }
          }
        });
      });
    }
  }, [step]);

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else handleGenerate();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleGenerate = async () => {
    if (!profile) return;
    setIsGenerating(true);
    setLoadingMessage("Weaving the threads of your magic story...");
    
    try {
      const { generateStory } = await import('@/services/groq');
      const { saveStory, updateStory } = await import('@/services/storage');
      const { generateAndSaveAudio } = await import('@/services/elevenlabs');
      
      const storyResult = await generateStory({
        childName: profile.name,
        age: profile.age,
        style: data.style,
        lesson: data.lesson,
        details: data.details,
        length: data.length,
        interests: profile.interests,
        heroMode: data.heroMode,
      });

      const savedStory = await saveStory({
        title: storyResult.title,
        content: storyResult.content,
        childName: profile.name,
        category: data.style, 
        ambientSound: storyResult.ambient_sound,
        voiceId: data.voiceId,
      });

      // Step 2: Generate narration
      try {
        setLoadingMessage("Preparing your high-quality narration...");
        const audioUri = await generateAndSaveAudio(savedStory.id, storyResult.content, data.voiceId);
        await updateStory(savedStory.id, { audioUri });
      } catch (audioError) {
        console.warn('Narration failed (falling back to device TTS):', audioError);
      }
      
      if (isMounted.current) {
        router.replace({
          pathname: '/reader',
          params: { storyId: savedStory.id }
        });
      }
    } catch (error) {
      if (isMounted.current) {
        alert(error instanceof Error ? error.message : 'Magic failed. Please try again.');
        setIsGenerating(false);
      }
    } finally {
      if (isMounted.current) {
        setIsGenerating(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Style 
          onSelect={(style: string) => setData({ ...data, style })} 
          selected={data.style} 
          onNext={handleNext} 
          onBack={handleBack} 
        />;
      case 2:
        return <Step2Lesson 
          onSelect={(lesson: string) => setData({ ...data, lesson })} 
          selected={data.lesson} 
          onNext={handleNext} 
          onBack={handleBack} 
        />;
      case 3:
        return <Step3Details 
          profile={profile} 
          onChange={(details: string) => setData({ ...data, details })} 
          value={data.details}
          heroMode={data.heroMode}
          onHeroModeChange={(heroMode: 'child' | 'character') => setData({ ...data, heroMode })}
          onNext={handleNext} 
          onBack={handleBack} 
        />;
      case 4:
        return <Step4Length 
          onSelect={(length: 'short' | 'medium' | 'long') => setData({ ...data, length })} 
          selected={data.length} 
          onNext={handleNext} 
          onBack={handleBack} 
        />;
      case 5:
        const { Step5Voice } = require('@/components/wizard/Step5Voice');
        return <Step5Voice 
          onSelect={(voiceId: string) => setData({ ...data, voiceId })} 
          selected={data.voiceId} 
          onNext={handleNext} 
          onBack={handleBack} 
          elevenlabsExhausted={elevenlabsExhausted}
        />;
      case 6:
        return <Step4Review 
          data={data} 
          profile={profile} 
          onEdit={(s: number) => setStep(s)} 
          onEditOnboarding={() => router.push('/edit-profile')} 
          onNext={handleGenerate} 
          onBack={handleBack} 
        />;
      default:
        return null;
    }
  };

  if (isGenerating) {
    return <StoryLoading message={loadingMessage} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View style={{ flex: 1, paddingTop: 24 }}>
        <View 
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16, marginTop: 8 }}
        >
          <Pressable 
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colorScheme === 'dark' ? '#18181B' : '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
          >
            <Ionicons name="close" size={18} color={colorScheme === 'dark' ? '#71717A' : '#0EA5E9'} />
          </Pressable>
          <View style={{ flex: 1, height: 6, backgroundColor: colorScheme === 'dark' ? '#18181B' : '#E0F2FE', borderRadius: 100, overflow: 'hidden' }}>
            <View 
              style={{ height: '100%', backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#0EA5E9', borderRadius: 100, width: `${(step / 6) * 100}%` }} 
            />
          </View>
          <Text style={{ marginLeft: 12, color: colorScheme === 'dark' ? '#52525B' : '#0EA5E9', fontWeight: '900', fontSize: 12 }}>{step}/6</Text>
        </View>

        <Animated.View 
          key={step}
          entering={FadeInDown.duration(600).springify()}
          style={{ flex: 1 }}
        >
          {renderStep()}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
