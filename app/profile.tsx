import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useColorScheme } from 'nativewind';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { MagicBackground } from '@/components/home/MagicBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * ProfileScreen - Displays the child's profile and provides access to editing.
 * Now supports custom avatars via avatarUri.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useOnboarding();
  const { signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toast, setToast] = React.useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View style={{ flex: 1, paddingTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 24 }}>
          <Pressable 
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: isDark ? '#18181B' : '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
          >
            <Ionicons name="chevron-back" size={22} color={isDark ? '#71717A' : '#0EA5E9'} />
          </Pressable>
          <Text style={{ flex: 1, color: isDark ? '#FFFFFF' : '#0C4A6E', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Profile</Text>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} style={{ gap: 16 }}>
            {/* Identity Card */}
            <LinearGradient 
              colors={isDark ? ['#18181B', '#09090B'] : ['#FFFFFF', '#F0F9FF']}
              className="p-6 rounded-[32px] border border-white dark:border-white/10 flex-row items-center shadow-xl shadow-sky-200/30 dark:shadow-none"
            >
              <View className="w-16 h-16 rounded-[24px] items-center justify-center bg-sky-500/10 dark:bg-zinc-800 shadow-sm overflow-hidden">
                {profile?.avatarUri ? (
                  <Image 
                    source={{ uri: profile.avatarUri }} 
                    className="w-full h-full" 
                    resizeMode="cover" 
                    onError={() => {
                      console.warn('Profile avatar load failed');
                      const { supabase } = require('@/services/supabase');
                      // No need to setProfile here as it will revert to emoji locally if avatarUri is dead
                      // But clearing it in the session state helps
                    }}
                  />
                ) : (
                  <Ionicons name={(profile?.emoji as any) || 'sparkles'} size={28} color={isDark ? '#FFFFFF' : '#0EA5E9'} />
                )}
              </View>
              <View className="ml-5 flex-1 pb-1">
                <Text className="text-zinc-900 dark:text-white text-[28px] font-black tracking-tight">{profile?.name || 'Dreamer'}</Text>
                <Text className="text-sky-600/70 dark:text-zinc-400 font-black text-[10px] uppercase tracking-widest mt-1.5">
                  {profile?.age || '?'} Years Old
                </Text>
              </View>
            </LinearGradient>

            {/* Interests Card */}
            {profile?.interests && profile.interests.length > 0 && (
              <LinearGradient 
                colors={isDark ? ['#18181B', '#09090B'] : ['#FFFFFF', '#F8FAFC']}
                className="p-8 rounded-[32px] border border-white dark:border-white/10 shadow-lg shadow-sky-200/20 dark:shadow-none"
              >
                <Text className="text-sky-600/70 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-5">Explore Interests</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {profile.interests.map((interest, idx) => (
                    <View key={idx} className="bg-sky-50 dark:bg-zinc-800/80 px-5 py-3 rounded-[20px] border border-sky-100 dark:border-zinc-700/50 shadow-sm">
                      <Text className="text-sky-700 dark:text-zinc-300 font-bold capitalize text-[13px] tracking-wide">{interest}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            )}

            {/* Actions */}
            <View style={{ gap: 16, marginTop: 12 }}>
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
                className="w-full py-5 rounded-[28px] bg-white border border-sky-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-xl shadow-sky-200/40 dark:shadow-none flex-row items-center justify-center"
              >
                <Text className="text-center text-[17px] font-bold text-sky-600 dark:text-white mr-2">Edit Profile</Text>
                <Ionicons name="pencil" size={18} color={isDark ? '#FFFFFF' : '#0284C7'} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={async () => {
                  try {
                    await signOut();
                  } catch (err: any) {
                    showToast(err.message || 'Logout failed', 'error');
                  }
                }}
                activeOpacity={0.6}
                className="w-full py-5 rounded-[28px] border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 active:scale-95 transition-transform duration-200 flex-row items-center justify-center"
              >
                <Text className="text-rose-500 dark:text-rose-400 text-center font-bold text-[17px] mr-2">Log Out</Text>
                <Ionicons name="log-out-outline" size={18} color={isDark ? '#FB7185' : '#F43F5E'} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Global Toast Placeholder */}
      {toast && (
        <View style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 9999 }} pointerEvents="none">
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={{
              paddingVertical: 16, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
              backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: toast.type === 'success' ? '#10B981' : '#F43F5E',
              shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
            }}
          >
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 6, borderRadius: 20 }}>
              <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={22} color="white" />
            </View>
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 12, flex: 1, fontSize: 16 }}>{toast.msg}</Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
