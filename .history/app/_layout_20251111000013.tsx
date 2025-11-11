import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

// --- Integración de Drizzle Studio ---
import * as SQLite from "expo-sqlite";
import { iniciarConexion } from "@/helpers/DbHelpers";
import SensorProvider from "@/components/SensorProvider";

// const db = drizzle(dbSqlite); // ORM opcional, no se usa aquí pero útil a futuro

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SQLite.SQLiteProvider
          databaseName="postura.db"
          onInit={iniciarConexion}
        >
          <SensorProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </SensorProvider>
        </SQLite.SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
