import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  FadeInDown,
  Easing
} from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Shared Values for Butter-Smooth Animations
  const floatValue = useSharedValue(0);
  const floatValue2 = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    floatValue2.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value * 20 }, { rotate: `${floatValue2.value * 12}deg` }],
  }));

  const animatedCloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: floatValue2.value * 30 }, { translateY: floatValue.value * 10 }],
  }));

  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const handleResetRequest = async () => {
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'dreamly://reset-password', // Update with your actual scheme if needed
      });
      if (error) throw error;
      showToast('Star-path reset email sent! Check your Gmail.', 'success');
      setTimeout(() => router.back(), 3000);
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sky-50 dark:bg-zinc-950">
      <LinearGradient
        colors={isDark ? ['#09090b', '#18181b'] : ['#F0F9FF', '#E0F2FE']}
        className="flex-1"
      >
        {/* Background Layer */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.View style={[animatedCloudStyle, { position: 'absolute', top: '15%', left: '10%' }]} className="opacity-20">
            <Ionicons name="cloud" size={100} color={isDark ? '#3F3F46' : '#BAE6FD'} />
          </Animated.View>
          <Animated.View style={[animatedStarStyle, { position: 'absolute', bottom: '15%', right: '15%' }]} className="opacity-20">
            <Ionicons name="sparkles" size={50} color={isDark ? '#A1A1AA' : '#38BDF8'} />
          </Animated.View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 px-8 pt-10">
            <Pressable 
              onPress={() => router.back()} 
              className="mb-8 w-12 h-12 items-center justify-center bg-white/50 dark:bg-zinc-900/50 rounded-full active:scale-90 transition-all"
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : '#0EA5E9'} />
            </Pressable>

            <Animated.View entering={FadeInDown.duration(600).springify()}>
              <Text className="text-[36px] font-black text-sky-950 dark:text-white leading-[42px] mb-4">
                Recover your{'\n'}Star-path
              </Text>
              <Text className="text-sky-600/80 dark:text-zinc-400 text-lg font-medium mb-12 max-w-[90%]">
                Forgotten the way back? We'll send a magical link to guide you.
              </Text>

              <View className="flex-row items-center mb-6 opacity-40">
                <Ionicons name="lock-closed" size={12} color={isDark ? '#71717A' : '#64748B'} />
                <Text className="text-[10px] uppercase font-bold tracking-widest ml-1.5 text-zinc-500">Secure Magical Link Protocol</Text>
              </View>

              <View>
                <View className="flex-row items-center mb-2 ml-1">
                  <Ionicons name="mail-outline" size={16} color={isEmailFocused ? '#0EA5E9' : (isDark ? '#71717A' : '#64748B')} />
                  <Text className={`font-bold ml-2 text-sm uppercase tracking-widest ${isEmailFocused ? 'text-sky-500' : 'text-sky-800 dark:text-zinc-400'}`}>Parent Email</Text>
                </View>
                <TextInput
                  className={`bg-white/90 dark:bg-zinc-900/90 p-5 rounded-[24px] border-2 text-zinc-900 dark:text-white text-lg ${
                    isEmailFocused ? 'border-sky-500' : 'border-white dark:border-zinc-800'
                  }`}
                  placeholder="parent@example.com"
                  placeholderTextColor={isDark ? '#3F3F46' : '#94A3B8'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>

              <Pressable 
                onPress={handleResetRequest} 
                disabled={loading}
                className="mt-8 active:opacity-90 active:scale-[0.98]"
              >
                <LinearGradient
                  colors={['#0EA5E9', '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="py-5 rounded-[30px] items-center justify-center shadow-lg shadow-sky-300 dark:shadow-none"
                >
                  {loading ? <ActivityIndicator color="white" /> : (
                    <Text className="text-white text-xl font-black tracking-tight">Send Magic Link</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        {/* Magic Toast */}
        {toast && (
          <View style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 9999 }} pointerEvents="none">
            <Animated.View entering={FadeInDown.duration(400).springify().damping(15)}>
              <View style={{
                paddingVertical: 16, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
                backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: toast.type === 'success' ? '#10B981' : '#F43F5E',
                shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
              }}>
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 6, borderRadius: 20 }}>
                  <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={22} color="white" />
                </View>
                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 12, flex: 1, fontSize: 16, lineHeight: 20 }}>{toast.msg}</Text>
              </View>
            </Animated.View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
