import React from 'react';
import { View, Pressable, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

interface HomeHeaderProps {}

const PILL_WIDTH = 64;
const PILL_HEIGHT = 32;
const KNOB_SIZE = 26;
const TRAVEL = PILL_WIDTH - KNOB_SIZE - 6;

export const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { profile } = useOnboarding();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const progress = useSharedValue(isDark ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, {
      damping: 20,
      stiffness: 180,
      mass: 0.6,
    });
  }, [isDark]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#F0F9FF', '#1E1B4B']
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(14, 165, 233, 0.2)', 'rgba(255, 255, 255, 0.1)']
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, TRAVEL]) },
    ],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#FFFFFF', '#312E81']
    ),
  }));

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 0.5], [1, 0.5]) }],
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0.5, 1], [0.5, 1]) }],
  }));

  return (
    <View className="px-8 pt-4 pb-2">
      <View className="flex-row items-center justify-end">
        <Pressable onPress={toggleColorScheme} hitSlop={8}>
          <Animated.View style={[styles.pill, pillStyle]}>
            <Animated.View style={[styles.knob, knobStyle]}>
              <Animated.View style={[styles.iconWrap, sunStyle]}>
                <Ionicons name="sunny" size={16} color="#F59E0B" />
              </Animated.View>
              <Animated.View style={[styles.iconWrap, styles.overlay, moonStyle]}>
                <Ionicons name="moon" size={14} color="#A5B4FC" />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
