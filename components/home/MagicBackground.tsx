import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
  withDelay,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const orbColorsLight = ['#0EA5E9', '#F472B6', '#818CF8'];
const orbColorsDark = ['#38BDF8', '#818CF8', '#C084FC'];

const Particle = ({ delay, size, startX, startY, type, colorIndex, isDark }: { delay: number, size: number, startX: number, startY: number, type: 'orb' | 'star', colorIndex: number, isDark: boolean }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
 
  // Launch animations ONLY ONCE when mounted. Never interrupt them.
  React.useEffect(() => {
    translateY.value = withRepeat(
      withDelay(delay, withSequence(
        withTiming(-80, { duration: 6000 + Math.random() * 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000 + Math.random() * 3000, easing: Easing.inOut(Easing.sin) })
      )), -1, false
    );
 
    translateX.value = withRepeat(
      withDelay(delay * 1.5, withSequence(
        withTiming(40, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) })
      )), -1, false
    );
 
    opacity.value = withRepeat(
      withDelay(delay, withSequence(
        withTiming(type === 'orb' ? 0.6 : 0.9, { duration: 3000 }),
        withTiming(0.1, { duration: 3000 })
      )), -1, false
    );
 
    if (type === 'star') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1, false
      );
    }
  }, []); // <-- Empty dependency array! Never restarts on theme change.
 
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ] as any,
    opacity: opacity.value,
  }));

  if (type === 'star') {
    return (
      <Animated.View style={[styles.particle, { left: startX, top: startY }, animatedStyle] as any} pointerEvents="none">
        <Ionicons name="star" size={size} color={isDark ? '#FFFFFF' : '#0EA5E9'} />
      </Animated.View>
    );
  }

  const color = isDark ? orbColorsDark[colorIndex] : orbColorsLight[colorIndex];

  return (
    <Animated.View 
      style={[
        styles.particle, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          left: startX,
          top: startY,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: size / 2,
        }, 
        animatedStyle as any,
      ] as any} 
      pointerEvents="none"
    />
  );
};

export const MagicBackground = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme } = useColorScheme();
  const themeValue = useSharedValue(colorScheme === 'dark' ? 1 : 0);

  const contentOpacity = useSharedValue(1);

  React.useEffect(() => {
    themeValue.value = withTiming(colorScheme === 'dark' ? 1 : 0, { duration: 600 });
    
    // Smooth fade for content during theme change
    contentOpacity.value = withSequence(
      withTiming(0.7, { duration: 200 }),
      withTiming(1, { duration: 400 })
    );
  }, [colorScheme]);

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      themeValue.value,
      [0, 1],
      ['#BAE6FD', '#0a0a20']
    );
    return { backgroundColor };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  
  // NEVER regenerate particles on theme change. Render once.
  const particles = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      type: (i % 3 === 0) ? 'star' : 'orb' as 'star' | 'orb',
      size: (i % 3 === 0) ? Math.random() * 12 + 10 : Math.random() * 80 + 40,
      startX: Math.random() * width,
      startY: Math.random() * height,
      delay: Math.random() * 5000,
      colorIndex: i % 3,
    }));
  }, []); // <-- Empty dependency array!

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, backgroundStyle]} />
      {particles.map((p) => (
        <Particle 
          key={p.id}
          delay={p.delay}
          size={p.size}
          startX={p.startX}
          startY={p.startY}
          type={p.type}
          colorIndex={p.colorIndex}
          isDark={colorScheme === 'dark'}
        />
      ))}
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  content: {
    flex: 1,
  }
});
