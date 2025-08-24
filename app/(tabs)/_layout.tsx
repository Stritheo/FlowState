import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { InfoTooltip } from '@/components/InfoTooltip';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const CheckInHeaderRight = () => (
    <View style={headerStyles.headerRightContainer}>
      <InfoTooltip
        title="Check-In Guide"
        content={`Quick Guide to Flow State Check-Ins:

ENERGY SCALE (1-7):
1-2: Very Low - Tired, drained, need rest
3-4: Moderate - Calm, steady energy
5-6: High - Energized, alert
7: Very High - Intense, potentially restless

FOCUS SCALE (1-7):
1-2: Unfocused - Scattered, distracted thoughts
3-4: Moderate - Clear, directed attention
5-6: Focused - Good mental clarity
7: Laser Focus - Intense concentration

OPTIMAL RANGE (3-5):
The sweet spot where both energy and focus align for peak performance and sustainable productivity.

QUICK TIPS:
• Check in at the same time daily
• Be honest about your current state
• Look for patterns over time
• Use insights to optimize your day`}
        size={18}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            // Ensure the tab bar respects safe areas
            paddingBottom: 0,
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check-In',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerRight: CheckInHeaderRight,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const headerStyles = StyleSheet.create({
  headerRightContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
