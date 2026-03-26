import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  interpolateColor 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Image } from 'react-native';

export const MagicTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colorScheme } = useColorScheme();
  const { profile } = useOnboarding();
  const router = useRouter();
  const themeValue = useSharedValue(colorScheme === 'dark' ? 1 : 0);

  React.useEffect(() => {
    themeValue.value = withTiming(colorScheme === 'dark' ? 1 : 0, { duration: 600 });
  }, [colorScheme]);

  const isDark = colorScheme === 'dark';
  const activeColor = isDark ? '#FFFFFF' : '#0EA5E9';
  const inactiveColor = isDark ? '#52525B' : '#94A3B8';

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      themeValue.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.85)', 'rgba(9, 9, 11, 0.85)']
    );
    return { backgroundColor };
  });

  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (profile?.avatarUri) {
      setImageError(false);
    }
  }, [profile?.avatarUri]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tabBar, animatedStyle]}>
        <BlurView intensity={isDark ? 20 : 50} style={StyleSheet.absoluteFill} />
        
        {/* Profile / Account button */}
        <Pressable
          onPress={() => router.push('/profile')}
          style={styles.tabItem}
        >
          <View style={[styles.actionIcon, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(14, 165, 233, 0.1)',
          }]}>
            {profile?.avatarUri && !imageError ? (
              <Image 
                source={{ uri: profile.avatarUri }} 
                style={{ width: '100%', height: '100%', borderRadius: 16 }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name={(profile?.emoji as any) || 'person'} size={20} color={activeColor} />
            )}
          </View>
        </Pressable>

        {/* Tab routes */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = route.name === 'index' ? 'home' : 'book';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons 
                name={iconName as any} 
                size={24} 
                color={isFocused ? activeColor : inactiveColor} 
              />
              {isFocused && (
                <View style={[styles.dot, { backgroundColor: activeColor }]} />
              )}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  }
});
