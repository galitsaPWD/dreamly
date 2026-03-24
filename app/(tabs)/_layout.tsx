import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { MagicTabBar } from '@/components/navigation/MagicTabBar';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      tabBar={props => <MagicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
