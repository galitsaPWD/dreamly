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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation logic
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

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const handleResetPassword = async () => {
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Star-path updated! Logging you in...', 'success');
      setTimeout(() => router.replace('/'), 3000);
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
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.View style={[animatedStarStyle, { position: 'absolute', top: '20%', right: '10%' }]} className="opacity-20">
            <Ionicons name="sparkles" size={60} color={isDark ? '#A1A1AA' : '#38BDF8'} />
          </Animated.View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 px-8 pt-16">
            <Animated.View entering={FadeInDown.duration(600).springify()}>
              <Text className="text-[36px] font-black text-sky-950 dark:text-white leading-[42px] mb-4">
                Enter your{'\n'}New Star-path
              </Text>
              <Text className="text-sky-600/80 dark:text-zinc-400 text-lg font-medium mb-12">
                Choose a strong new password to keep your magical world safe.
              </Text>

              <View className="gap-y-5">
                <View>
                  <View className="flex-row items-center mb-2 ml-1">
                    <Ionicons name="lock-closed-outline" size={16} color={isPasswordFocused ? '#0EA5E9' : (isDark ? '#71717A' : '#64748B')} />
                    <Text className={`font-bold ml-2 text-sm uppercase tracking-widest ${isPasswordFocused ? 'text-sky-500' : 'text-sky-800 dark:text-zinc-400'}`}>New Password</Text>
                  </View>
                  <TextInput
                    className={`bg-white/90 dark:bg-zinc-900/90 p-5 rounded-[24px] border-2 text-zinc-900 dark:text-white text-lg ${
                      isPasswordFocused ? 'border-sky-500' : 'border-white dark:border-zinc-800'
                    }`}
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#3F3F46' : '#94A3B8'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                </View>

                <View>
                  <View className="flex-row items-center mb-2 ml-1">
                    <Ionicons name="lock-closed-outline" size={16} color={isConfirmFocused ? '#0EA5E9' : (isDark ? '#71717A' : '#64748B')} />
                    <Text className={`font-bold ml-2 text-sm uppercase tracking-widest ${isConfirmFocused ? 'text-sky-500' : 'text-sky-800 dark:text-zinc-400'}`}>Confirm Password</Text>
                  </View>
                  <TextInput
                    className={`bg-white/90 dark:bg-zinc-900/90 p-5 rounded-[24px] border-2 text-zinc-900 dark:text-white text-lg ${
                      isConfirmFocused ? 'border-sky-500' : 'border-white dark:border-zinc-800'
                    }`}
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#3F3F46' : '#94A3B8'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    onFocus={() => setIsConfirmFocused(true)}
                    onBlur={() => setIsConfirmFocused(false)}
                  />
                </View>
              </View>

              <Pressable 
                onPress={handleResetPassword} 
                disabled={loading}
                className="mt-10 active:opacity-90 active:scale-[0.98]"
              >
                <LinearGradient
                  colors={['#0EA5E9', '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="py-5 rounded-[30px] items-center justify-center shadow-lg shadow-sky-300 dark:shadow-none"
                >
                  {loading ? <ActivityIndicator color="white" /> : (
                    <Text className="text-white text-xl font-black tracking-tight">Update Star-path</Text>
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
