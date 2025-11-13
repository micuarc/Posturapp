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
import * as SQLite from "expo-sqlite";
import { iniciarConexion } from "@/helpers/DbHelpers";
import SensorProvider from "@/components/SensorProvider";
import AuthProvider from "@/components/AuthProvider";
import { useAuth } from "@/helpers/AuthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootStack() {
  const { usuario } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {usuario ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <>
          <Stack.Screen name="login" />
          <Stack.Screen name="registro" />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SQLite.SQLiteProvider
            databaseName="postura.db"
            onInit={iniciarConexion}
          >
            <SensorProvider>
              <RootStack />
              <StatusBar style="auto" />
            </SensorProvider>
          </SQLite.SQLiteProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
