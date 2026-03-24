import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding, ChildProfile } from '@/hooks/useOnboarding';
import Step1 from '@/components/onboarding/Step1';
import Step2 from '@/components/onboarding/Step2';
import Step3 from '@/components/onboarding/Step3';
import Step4 from '@/components/onboarding/Step4';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, profile: savedProfile } = useOnboarding();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ChildProfile>({
    name: savedProfile?.name || '',
    age: savedProfile?.age || '',
    emoji: savedProfile?.emoji || 'moon-outline',
    interests: savedProfile?.interests || [],
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    
    console.log('Completing onboarding with profile:', profile);
    
    // Safety fallback: If it takes more than 10s, just go home anyway
    const forceNavigation = setTimeout(() => {
      console.warn('Onboarding completion taking too long, forcing navigation...');
      router.replace('/(tabs)');
    }, 10000);

    try {
      await completeOnboarding(profile);
      clearTimeout(forceNavigation);
      console.log('Onboarding state saved, navigating to home...');
      router.replace('/(tabs)');
    } catch (err) {
      clearTimeout(forceNavigation);
      console.error('Error during onboarding completion:', err);
      // Even on error, we try to move forward so the user isn't stuck
      router.replace('/(tabs)');
    } finally {
      setCompleting(false);
    }
  };

  const updateProfile = (updates: Partial<ChildProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const toggleInterest = (id: string) => {
    setProfile((prev) => {
      const current = prev.interests;
      if (current.includes(id)) {
        return { ...prev, interests: current.filter((i) => i !== id) };
      } else if (current.length < 3) {
        return { ...prev, interests: [...current, id] };
      }
      return prev;
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 onNext={nextStep} />;
      case 2:
        return <Step2 profile={profile} updateProfile={updateProfile} onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <Step3 profile={profile} toggleInterest={toggleInterest} onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <Step4 profile={profile} onComplete={handleComplete} onBack={prevStep} completing={completing} />;
      default:
        return <Step1 onNext={nextStep} />;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1 }}>
      <View className="flex-1 px-6 pt-10 overflow-visible" style={{ flex: 1 }}>
        {step > 1 && (
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-2 bg-sky-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <View 
                className="h-full bg-sky-500 dark:bg-white transition-all duration-500" 
                style={{ width: `${(step / 4) * 100}%` }} 
              />
            </View>
            <Text className="ml-4 text-sky-600 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">Step {step} of 4</Text>
          </View>
        )}
        <Animated.View 
          key={step}
          entering={FadeIn.duration(400)}
          className="flex-1"
          style={{ flex: 1 }}
        >
          {renderStep()}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
