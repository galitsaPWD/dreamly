import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface DreamlyLogoProps {
  size?: number;
}

export default function DreamlyLogo({ size = 80 }: DreamlyLogoProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const moonSize = size;
  const starSize = size * 0.45;
  
  // Softer, kid-friendly colors
  // Light mode: Soft Indigo / Sky Blue
  // Dark mode: Off-white / Soft Blue
  const moonColor = isDark ? '#E0F2FE' : '#38BDF8'; // Sky-100 vs Sky-400
  const starColor = isDark ? '#FDE68A' : '#FBBF24'; // Amber-200 vs Amber-400
  const glowColor = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(224, 242, 254, 0.8)';

  return (
    <View style={[styles.container, { width: size * 1.3, height: size * 1.3 }]}>
      {/* Soft Cloud-like Glow Backdrop */}
      <View 
        style={[
          styles.glow, 
          { 
            backgroundColor: glowColor,
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
          }
        ]} 
      />
      
      <View style={styles.moonContainer}>
        <Ionicons name="moon" size={moonSize} color={moonColor} />
      </View>
      
      <View 
        style={[
          styles.starContainer, 
          { 
            top: size * 0.12, 
            right: size * 0.18
          }
        ]}
      >
        <Ionicons name="star" size={starSize} color={starColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 0,
      }
    }),
  },
  moonContainer: {
    // Slight tilt for a more playful "sleepy" look
    transform: [{ rotate: '-10deg' }],
  },
  starContainer: {
    position: 'absolute',
    // Star has a slight outer glow feel by its color choice
  }
});
