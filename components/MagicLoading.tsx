import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  withSpring,
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function MagicLoading() {
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false
    );
  }, []);

  const auraStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.4], Extrapolate.CLAMP);
    const opacity = interpolate(pulse.value, [0, 1], [0.3, 0], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
      opacity
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.05], Extrapolate.CLAMP);
    return {
      transform: [{ scale }]
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }]
    };
  });

  return (
    <Animated.View 
      entering={FadeIn.duration(600)} 
      exiting={FadeOut.duration(500)}
      style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}
      pointerEvents="none"
    >
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(240, 249, 255, 0.7)', 'rgba(224, 242, 254, 0.8)', 'rgba(219, 234, 254, 0.7)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View className="flex-1 items-center justify-center">
          {/* Main Content Container */}
          <View className="items-center justify-center">
            
            {/* Glowing Aura Part 1 */}
            <Animated.View 
              style={[
                auraStyle,
                {
                  position: 'absolute',
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: '#0EA5E9',
                }
              ]}
            />
            
            {/* Glowing Aura Part 2 (Delayed) */}
            <Animated.View 
              style={[
                {
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(14, 165, 233, 0.2)',
                }
              ]}
            />

            {/* Rotating Star Ring */}
            <Animated.View style={[ringStyle, { position: 'absolute' }]}>
               <View style={{ width: 140, height: 140 }}>
                 <Ionicons name="star" size={12} color="rgba(14, 165, 233, 0.3)" style={{ position: 'absolute', top: 0, left: '50%' }} />
                 <Ionicons name="star" size={10} color="rgba(14, 165, 233, 0.2)" style={{ position: 'absolute', bottom: 0, left: '40%' }} />
                 <Ionicons name="star" size={8} color="rgba(14, 165, 233, 0.3)" style={{ position: 'absolute', top: '50%', right: 0 }} />
                 <Ionicons name="star" size={10} color="rgba(14, 165, 233, 0.2)" style={{ position: 'absolute', top: '40%', left: 0 }} />
               </View>
            </Animated.View>

            {/* Central Icon Bubble */}
            <Animated.View 
              style={[
                iconStyle,
                {
                  width: 90,
                  height: 90,
                  backgroundColor: 'white',
                  borderRadius: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#0EA5E9',
                  shadowOffset: { width: 0, height: 15 },
                  shadowOpacity: 0.3,
                  shadowRadius: 25,
                  elevation: 15,
                  borderWidth: 1,
                  borderColor: 'rgba(14, 165, 233, 0.1)'
                }
              ]}
            >
              <Ionicons name="sparkles" size={40} color="#0EA5E9" />
            </Animated.View>

            {/* Label Section */}
            <View className="mt-12 items-center">
              <Text 
                className="text-sky-900 font-black text-xs uppercase tracking-[6px] opacity-40 mb-2"
              >
                Dreamly Engine
              </Text>
              <Text 
                className="text-sky-600 font-bold text-lg tracking-widest text-center"
              >
                Weaving Magic...
              </Text>
              
              {/* Progress Dots */}
              <View className="mt-6 flex-row space-x-3">
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 opacity-30"
                  />
                ))}
              </View>
            </View>

          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}
