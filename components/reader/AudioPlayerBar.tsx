import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { WaveformBars } from './WaveformBars';
import Slider from '@react-native-community/slider';

interface AudioPlayerBarProps {
  isSpeaking: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSeek?: (progress: number) => void;
  onSpeedChange?: (speed: number) => void;
  progress: number; // 0 to 1
  elapsedTime: string; // formatted "m:ss"
  totalTime: string;
  onRefresh?: () => void;
  ambientLabel?: string;
  speed: number;
  isDark: boolean;
  isRepairing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isSpeaking,
  isExpanded,
  onToggle,
  onSeek,
  onSpeedChange,
  progress,
  elapsedTime,
  totalTime,
  onRefresh,
  ambientLabel = 'Magic',
  speed,
  isDark,
  isRepairing = false,
}) => {
  const expandAnim = useSharedValue(isExpanded ? 1 : 0);
  const waveformWidth = useSharedValue(0);

  React.useEffect(() => {
    expandAnim.value = withSpring(isExpanded ? 1 : 0, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
  }, [isExpanded]);

  const containerStyle = useAnimatedStyle(() => ({
    height: 64, // Keep height consistent
  }));

  const activeColor = isDark ? '#818CF8' : '#0EA5E9';
  const inactiveBarColor = isDark ? 'rgba(113, 113, 122, 0.25)' : 'rgba(148, 163, 184, 0.25)';

  const speeds = [1.0, 1.25, 1.5];
  const cycleSpeed = () => {
    const currentIdx = speeds.indexOf(speed);
    const nextIdx = (currentIdx + 1) % speeds.length;
    onSpeedChange?.(speeds[nextIdx]);
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerStyle]}>
        <BlurView
          intensity={isDark ? 60 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.blur]}
        />
        <View style={[
          StyleSheet.absoluteFill, 
          styles.blur, 
          { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)' }
        ]} />

        {/* Collapsed: "Read to Me" */}
        {!isExpanded && (
          <Animated.View 
            entering={FadeIn.duration(200)} 
            exiting={FadeOut.duration(150)}
            style={styles.collapsedContent}
          >
            <Pressable onPress={onToggle} style={styles.readToMeBtn}>
              <Ionicons 
                name="play" 
                size={22} 
                color={isDark ? '#FFFFFF' : '#0F172A'} 
              />
              <Text style={[
                styles.readToMeText,
                { color: isDark ? '#FFFFFF' : '#0F172A' }
              ]}>
                Read to Me
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Expanded: Full player in ONE row */}
        {isExpanded && (
          <Animated.View 
            entering={FadeIn.delay(100).duration(300)}
            exiting={FadeOut.duration(150)}
            style={styles.expandedContent}
          >
            <View style={styles.singleRow}>
              <Pressable onPress={onToggle} style={styles.playBtn} hitSlop={8}>
                <Ionicons
                  name={isSpeaking ? 'pause' : 'play'}
                  size={24}
                  color={isDark ? '#FFFFFF' : '#0F172A'}
                />
              </Pressable>

              <View style={styles.waveformContainer}>
                <WaveformBars
                  isPlaying={isSpeaking}
                  progress={progress}
                  barCount={22}
                  activeColor={activeColor}
                  inactiveColor={inactiveBarColor}
                  height={24}
                />
                <Slider
                  style={StyleSheet.absoluteFill}
                  minimumValue={0}
                  maximumValue={1}
                  value={progress}
                  onValueChange={(val: number) => onSeek?.(val)}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent"
                />
              </View>

              <View style={styles.timeSection}>
                <Text style={[styles.timeText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                  {isRepairing ? "Generating..." : `${elapsedTime} / ${totalTime}`}
                </Text>
                
                {onRefresh && (
                  <Pressable onPress={onRefresh} hitSlop={8} style={styles.speedBtn}>
                    <View style={[styles.speedBadge, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
                    }]}>
                      <Ionicons name="refresh" size={12} color={isDark ? '#A1A1AA' : '#64748B'} />
                    </View>
                  </Pressable>
                )}

                <Pressable onPress={cycleSpeed} hitSlop={8} style={styles.speedBtn}>
                  <View style={[styles.speedBadge, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
                  }]}>
                    <Text style={[styles.speedText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                      {speed}x
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
  },
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  blur: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  collapsedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readToMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  readToMeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  waveformContainer: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  speedBtn: {
    marginLeft: 4,
  },
  speedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
