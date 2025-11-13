import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { PlatformPressable } from '@react-navigation/elements';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs, Redirect } from 'expo-router';
import { Home, Stars, ClipboardPlus, CircleGauge, User, Settings } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Circle } from 'react-native-svg';
import { useAuth } from '@/helpers/AuthContext';

export default function TabLayout() {
  const primary = useColor('primary');
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF9966",
        headerShown: false,
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            onPressIn={(ev) => {
              if (process.env.EXPO_OS === 'ios') {
                // Add a soft haptic feedback when pressing down on the tabs.
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              props.onPressIn?.(ev);
            }}
          />
        ),
        tabBarBackground: () => {
          if (Platform.OS === 'ios') {
            return (
              <BlurView
                tint='systemChromeMaterial'
                intensity={100}
                style={StyleSheet.absoluteFill}
              />
            );
          }
          // On Android & Web: no background
          return null;
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 0,
            elevation: 0,
          },
        }),
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name={Home} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='monitoreo'
        options={{
          title: 'Monitoreo',
          tabBarIcon: ({ color }) => (
            <Icon name={ClipboardPlus} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='dashboard'
        options={{
          title: 'Métricas',
          tabBarIcon: ({ color }) => (
            <Icon name={CircleGauge} size={24} color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name='configuracion'
          options={{
            title: 'Config',
            tabBarIcon: ({ color }) => (
              <Icon name={Settings} size={24} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name='perfil'
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Icon name={User} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
