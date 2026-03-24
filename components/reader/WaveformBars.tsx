import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface WaveformBarsProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  barCount?: number;
  activeColor?: string;
  inactiveColor?: string;
  height?: number;
}

// Generate deterministic bar heights from a seed
const generateBarHeights = (count: number): number[] => {
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    // Create a natural waveform-like pattern
    const base = 0.3;
    const wave = Math.sin(i * 0.5) * 0.25;
    const noise = Math.sin(i * 2.7 + 1.3) * 0.15 + Math.sin(i * 4.1 + 0.7) * 0.1;
    heights.push(Math.max(0.15, Math.min(1, base + wave + noise)));
  }
  return heights;
};

const WaveformBar = React.memo(({ 
  index, 
  baseHeight, 
  isPlaying, 
  isActive, 
  activeColor, 
  inactiveColor,
  maxHeight,
}: {
  index: number;
  baseHeight: number;
  isPlaying: boolean;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  maxHeight: number;
}) => {
  const animation = useSharedValue(0);

  React.useEffect(() => {
    if (isPlaying && isActive) {
      animation.value = withDelay(
        index * 40,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 + (index % 3) * 100, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 400 + (index % 4) * 80, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    } else {
      animation.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying, isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    const pulse = interpolate(animation.value, [0, 1], [0, 0.35]);
    const height = (baseHeight + pulse) * maxHeight;
    return {
      height: Math.max(3, height),
      backgroundColor: isActive ? activeColor : inactiveColor,
    };
  });

  return (
    <Animated.View style={[styles.bar, animatedStyle]} />
  );
});

export const WaveformBars: React.FC<WaveformBarsProps> = ({
  isPlaying,
  progress,
  barCount = 32,
  activeColor = '#0EA5E9',
  inactiveColor = 'rgba(148, 163, 184, 0.3)',
  height = 32,
}) => {
  const barHeights = React.useMemo(() => generateBarHeights(barCount), [barCount]);

  return (
    <View style={[styles.container, { height }]}>
      {barHeights.map((h, i) => (
        <WaveformBar
          key={i}
          index={i}
          baseHeight={h}
          isPlaying={isPlaying}
          isActive={i / barCount <= progress}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          maxHeight={height}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 2,
  },
});
