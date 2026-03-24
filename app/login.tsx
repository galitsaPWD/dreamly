import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  UIManager
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { BlurView } from 'expo-blur';
import DreamlyLogo from '@/components/ui/DreamlyLogo';

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  FadeInDown,
  Easing
} from 'react-native-reanimated';
import { LayoutAnimation } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const floatValue = useSharedValue(0);
  const floatValue2 = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
    floatValue2.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (floatValue.value * 30) - 15 },
      { rotate: `${(floatValue2.value * 20) - 10}deg` } 
    ],
  }));

  const animatedCloud1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (floatValue2.value * 40) - 20 },
      { translateY: (floatValue.value * 40) - 20 } 
    ],
  }));

  const animatedCloud2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (floatValue.value * -50) + 25 },
      { translateY: (floatValue2.value * -30) + 15 } 
    ],
  }));

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const toggleMode = () => setIsSignUp(!isSignUp);

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: 'dreamly://' },
        });
        if (signUpError) throw signUpError;
        showToast('Magic link sent! Please check your email.', 'success');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <LinearGradient
        colors={isDark ? ['#050B14', '#0A051A', '#020617'] : ['#F0F9FF', '#FDF4FF', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView className="flex-1">
      <View className="flex-1">
        {/* Local Celestial Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View 
            style={[animatedCloud1Style, { position: 'absolute', top: '35%', right: -20, opacity: 0.3 }]}
          >
            <Ionicons name="cloud" size={120} color={isDark ? '#F1F5F9' : '#BAE6FD'} />
          </Animated.View>
          <Animated.View 
            style={[animatedCloud2Style, { position: 'absolute', bottom: '20%', left: -30, opacity: 0.2 }]}
          >
            <Ionicons name="cloud" size={140} color={isDark ? '#F1F5F9' : '#BAE6FD'} />
          </Animated.View>
          <Animated.View 
            style={[animatedStarStyle, { position: 'absolute', top: '22%', right: '15%', opacity: 0.4 }]}
          >
            <Ionicons name="planet" size={60} color={isDark ? '#E0E7FF' : '#38BDF8'} />
          </Animated.View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-8 py-12 justify-center">
              <Animated.View 
                key={isSignUp ? 'signup' : 'signin'} 
                entering={FadeInDown.duration(800).springify()}
              >
                {/* Ultra-Premium Centered Logo */}
                <View className="items-center mb-10 mt-4">
                  <View className="mb-8 items-center justify-center">
                    <DreamlyLogo size={80} />
                  </View>
                  
                  <Text className="text-[42px] font-black text-sky-950 dark:text-white text-center leading-[46px] tracking-tight">
                    {isSignUp ? 'Create\nthe Magic' : 'Welcome\nBack'}
                  </Text>
                </View>
                
                <View className="mt-8 space-y-6">
                  <View>
                    <Text className="text-sky-900 dark:text-sky-100 font-bold ml-2 mb-2 text-[11px] uppercase tracking-[2px]">Email</Text>
                    <View className={`rounded-[28px] overflow-hidden border bg-white/40 dark:bg-black/30 ${
                      isEmailFocused ? 'border-sky-500/80 shadow-lg shadow-sky-500/20' : 'border-white/50 dark:border-white/10'
                    }`}>
                      <TextInput
                        className="text-zinc-900 dark:text-white text-[17px] font-medium p-5 bg-transparent"
                        placeholder="parent@example.com"
                        placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-sky-900 dark:text-sky-100 font-bold ml-2 mb-2 text-[11px] uppercase tracking-[2px]">Password</Text>
                    <View className={`rounded-[28px] overflow-hidden border bg-white/40 dark:bg-black/30 ${
                      isPasswordFocused ? 'border-sky-500/80 shadow-lg shadow-sky-500/20' : 'border-white/50 dark:border-white/10'
                    }`}>
                      <TextInput
                        className="text-zinc-900 dark:text-white text-[17px] font-medium p-5 bg-transparent"
                        placeholder="••••••••"
                        placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                      />
                    </View>
                    {!isSignUp && (
                      <TouchableOpacity 
                        onPress={() => router.push('/forgot-password')} 
                        className="mt-3 ml-2"
                        hitSlop={10}
                      >
                        <Text className="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest">
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity 
                    onPress={handleAuth}
                    disabled={loading}
                    className="mt-6 active:scale-95 transition-transform duration-200"
                  >
                    <LinearGradient
                      colors={isDark ? ['#0284C7', '#0369A1'] : ['#0EA5E9', '#38BDF8']}
                      className="py-5 rounded-[28px] items-center justify-center shadow-xl shadow-sky-300/50 dark:shadow-none"
                    >
                      {loading ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white text-xl font-black tracking-wide">{isSignUp ? 'Get Started' : 'Sign In'}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={toggleMode} className="mt-8 p-4">
                  <Text className="text-center text-sky-900/70 dark:text-zinc-400 text-sm font-medium">
                    {isSignUp ? 'Already have an account? ' : "New here? "}
                    <Text className="text-sky-600 dark:text-sky-300 font-bold text-base">
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>

                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {toast && (
          <View style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 9999 }} pointerEvents="none">
            <Animated.View entering={FadeInDown.duration(400).springify().damping(15)}>
              <View style={{
                paddingVertical: 16, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
                backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)',
                borderColor: 'white/20', shadowColor: toast.type === 'success' ? '#10B981' : '#F43F5E',
                shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
              }}>
                <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={22} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 12, flex: 1 }}>{toast.msg}</Text>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
    </View>
  );
}
