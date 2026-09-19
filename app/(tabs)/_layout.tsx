import React, { useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, useRouter } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

/** Route guard: redirect to /login if the user is not authenticated. */
function useAuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);
}

// NativeTabs for iOS 26+ with liquid glass effect.
// 5 tabs: Dashboard, Sefer, Fiyat, Araç, Profil
function NativeTabLayout() {
  useAuthGuard();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sefer">
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <Label>Sefer</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fiyat">
        <Icon sf={{ default: 'eurosign.circle', selected: 'eurosign.circle.fill' }} />
        <Label>Fiyat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="arac">
        <Icon sf={{ default: 'car', selected: 'car.fill' }} />
        <Label>Araçlar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  useAuthGuard();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' || true; // always dark for Koch enterprise theme
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84, paddingBottom: 0 } : {}),
          ...(isIOS ? {} : { paddingBottom: isWeb ? 0 : insets.bottom }),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.card },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="sefer"
        options={{
          title: 'Sefer',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="clock.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="clock" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="fiyat"
        options={{
          title: 'Fiyat',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="eurosign.circle.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="dollar-sign" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="arac"
        options={{
          title: 'Araçlar',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="car.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="truck" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
