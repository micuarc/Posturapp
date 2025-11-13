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

let dbSqlite: null | SQLite.SQLiteDatabase;
    try {
      dbSqlite = SQLite.openDatabase("postura.db");
    } catch (e) {
      console.log(e)
    }

const db = drizzle(dbSqlite); // ORM opcional, no se usa aquí pero útil a futuro

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ✅ usar la base SQLite nativa, no el wrapper Drizzle
  useDrizzleStudio(dbSqlite);

  useEffect(() => {
    console.log("✅ Drizzle Studio activo — base 'postura.db' conectada.");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
