import React, { useCallback } from "react";
import { StyleSheet, Image, Alert, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Camera,
  Edit3,
  User,
  Cake,
  Transgender,
  Ruler,
  Weight,
  Dumbbell,
  LogOut,
  Key,
  DraftingCompass,
} from "lucide-react-native";
import dayjs from "dayjs";

import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/helpers/AuthContext";
import { useSQLiteContext } from "expo-sqlite";
import { useCargaPerfil } from "@/hooks/useCargaPerfil";
import { normalizarCaseString } from "@/helpers/NormalizarCaseString";
import { getUserIconSource } from "@/helpers/UserIcons";

export default function ProfileScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();
  const db = useSQLiteContext();
  const { perfil, cargando, error, cargarPerfil } = useCargaPerfil(
    db,
    usuario?.id
  );

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Pantalla de perfil enfocada, recargando datos...");
      if (usuario?.id) {
        cargarPerfil();
      }
    }, [usuario?.id])
  );

  const handleEditarPerfil = () => router.push("/(tabs)/perfil/editar");

  const handleCambiarPassword = () =>
    Alert.alert(
      "Cambiar Contraseña",
      "Panel no implementado. Intenta otro día."
    ); 

  const handleLogout = () =>
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);

  const calcularEdad = (fechaNacimiento: string | null): string => {
    if (!fechaNacimiento) return "No especificada";

    try {
      const hoy = dayjs();
      const nacimiento = dayjs(fechaNacimiento);

      if (!nacimiento.isValid()) return "No especificada";

      const edad = hoy.diff(nacimiento, "year");
      return `${edad} años`;
    } catch (error) {
      console.error("Error calculando edad:", error);
      return "No especificada";
    }
  };

  if (cargando) {
    return (
      <ScrollView style={styles.scrollView}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.title}>Cargando perfil...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!usuario) {
    return (
      <ScrollView style={styles.scrollView}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.title}>Usuario no autenticado</Text>
          <Button onPress={() => router.replace("/login")}>Ir al inicio</Button>
        </View>
      </ScrollView>
    );
  }

  const userData = {
    name: perfil?.nombre
      ? `${perfil.nombre} ${perfil.apellido || ""}`.trim()
      : usuario.email,
    email: usuario.email,
    age: calcularEdad(perfil?.fechaNacimiento || null),
    gender: perfil?.genero || "No especificado",
    height: perfil?.alturaCm ? `${perfil.alturaCm} cm` : "No especificada",
    weight: perfil?.pesoKg ? `${perfil.pesoKg} kg` : "No especificado",
    muscle: perfil?.porcMusculo ? `${perfil.porcMusculo}%` : "No especificado",
    fat: perfil?.porcGrasa ? `${perfil.porcGrasa}%` : "No especificado",
  };

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="heading" style={styles.title}>
              Perfil de Usuario
            </Text>
            <Text variant="subtitle" style={styles.subtitle}>
              Información personal y física
            </Text>
          </View>
        </View>

        <View style={styles.avatarContainer}>
          <Pressable style={styles.avatarWrapper} onPress={handleEditarPerfil}>
            <View style={styles.avatarBg}>
              {perfil?.userIcon ? (
                <Image
                  source={getUserIconSource(perfil.userIcon) as any}
                  style={styles.avatar}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.defaultAvatarWrapper}>
                  <User color="#FF9966" size={70} strokeWidth={2} />
                </View>
              )}
            </View>
            <View style={styles.cameraButton}>
              <Camera color="white" size={18} />
            </View>
          </Pressable>
          <Text style={styles.userName}>{normalizarCaseString(userData.name)}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Información Personal</Text>
            <Edit3 color="#FF9966" size={20} onPress={handleEditarPerfil} />
          </View>

          <View style={styles.infoRow}>
            <User color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{normalizarCaseString(userData.name)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Cake color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{userData.age}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Transgender color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Género</Text>
              <Text style={styles.infoValue}>{normalizarCaseString(userData.gender)}</Text>
            </View>
          </View>
        </View>


        <View style={styles.card}>
          
                    <View style={styles.cardHeader}>

          <Text style={styles.cardTitle}>Información Física</Text>
          </View>

          <View style={styles.infoRow}>
            <Ruler color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Altura</Text>
              <Text style={styles.infoValue}>{userData.height}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Weight color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{userData.weight}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Dumbbell color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Músculo</Text>
              <Text style={styles.infoValue}>{userData.muscle}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <DraftingCompass color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Grasa</Text>
              <Text style={styles.infoValue}>{userData.fat}</Text>
            </View>
          </View>
        </View>

        <Button
          size="lg"
          variant="outline"
          style={[styles.button, { borderColor: "#FF9966", backgroundColor: "#FFFFFF" }]}
          onPress={handleCambiarPassword}
          icon={(props) => <Key {...props} color="#FF9966" />}
        >
          Cambiar Contraseña
        </Button>

        <Button
          size="lg"
          style={[styles.button, { backgroundColor: "#ff8266ff" }]}
          onPress={handleLogout}
          icon={(props) => <LogOut {...props} color="#FFFFFF" />}
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF9F2", 
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    paddingBottom: 80,
  },
  inner: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#8B5A2B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0522D",
    opacity: 0.8,
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarBg: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "#FFE5CC",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFD2B3",
  },
  avatar: {
    width: 95,
    height: 95,
  },
  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#FF9966",
    borderRadius: 20,
    padding: 6,
  },
  userName: {
    color: "#8B5A2B",
    fontWeight: "700",
    fontSize: 22,
    marginTop: 10,
  },
  userEmail: {
    color: "#A0522D",
    fontSize: 16,
    marginTop: 4,
    opacity: 0.7,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFEFE1",
    borderWidth: 1,
    borderColor: "#FFD2B3",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#8B5A2B",
    fontWeight: "700",
    fontSize: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoText: {
    marginLeft: 10,
  },
  infoLabel: {
    color: "#A0522D",
    fontSize: 12,
  },
  infoValue: {
    color: "#8B5A2B",
    fontWeight: "600",
  },
  button: {
    marginBottom: 16,
    borderRadius: 16,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5CC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  debugButtonText: {
    color: "#8B5A2B",
    fontSize: 14,
    fontWeight: "600",
  },
  defaultAvatarWrapper: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#FFEFE1",
    alignItems: "center",
    justifyContent: "center",
  },
});
