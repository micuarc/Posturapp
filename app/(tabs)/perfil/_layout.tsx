import { Stack } from "expo-router";

export default function PerfilLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="editar" options={{ headerShown: false }} />
    </Stack>
  );
}
