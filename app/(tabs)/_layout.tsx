import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        sceneStyle: { backgroundColor: colors.background },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: Platform.OS === 'ios' ? 10 : 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingHorizontal: 10,
          shadowColor: colors.tabShadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 10,
          ...Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              backgroundColor: 'transparent',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.5,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 12,
          marginHorizontal: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          sceneStyle: { backgroundColor: colors.background },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={focused ? 26 : 24} 
                color={color} 
              />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          sceneStyle: { backgroundColor: colors.background },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={focused ? 26 : 24} 
                color={color} 
              />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Favourites',
          sceneStyle: { backgroundColor: colors.background },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name={focused ? 'heart' : 'heart-outline'} 
                size={focused ? 26 : 24} 
                color={color} 
              />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          sceneStyle: { backgroundColor: colors.background },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={focused ? 26 : 24} 
                color={color} 
              />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
