import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Integración de Drizzle Studio ---
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { useEffect } from "react";
import { useDatabase } from '@/hooks/useDatabase';
import { useWifiSensor } from '@/hooks/useWifiSensor';
import { SensorContext } from '@/helpers/SensorContext';
import SensorProvider from '@/components/SensorProvider';


// const db = drizzle(dbSqlite); // ORM opcional, no se usa aquí pero útil a futuro

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { db: dbSqlite, iniciarConexion } = useDatabase();
  const colorScheme = useColorScheme();

  // ✅ usar la base SQLite nativa, no el wrapper Drizzle
  useDrizzleStudio(dbSqlite);

  useEffect(() => {
    iniciarConexion();
    console.log("✅ Drizzle Studio activo — base 'postura.db' conectada.");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SensorProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </SensorProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
