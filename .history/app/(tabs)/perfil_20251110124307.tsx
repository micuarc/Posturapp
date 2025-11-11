import React, { useState } from "react";
import { StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Edit3, User, Cake, Transgender, Ruler, Weight, Dumbbell, LogOut, Key, DraftingCompass } from "lucide-react-native";
import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

export default function ProfileScreen() {
  const router = useRouter();

  const [userData] = useState({
    name: "María González",
    birthDate: "15/03/1990",
    gender: "Femenino",
    height: "165 cm",
    weight: "62 kg",
    muscle: "28%",
    fat: "22%",
  });

  const handleEditProfile = () => Alert.alert("Editar Perfil", "Funcionalidad no implementada");
  const handleChangePassword = () => Alert.alert("Cambiar Contraseña", "Funcionalidad no implementada");
  const handleLogout = () =>
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar Sesión", onPress: () => router.push("/login") },
    ]);

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <Text variant="heading" style={styles.title}>
          Perfil de Usuario
        </Text>
        <Text variant="subtitle" style={styles.subtitle}>
          Información personal y física
        </Text>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900",
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraButton}>
              <Camera color="white" size={18} />
            </View>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
        </View>

        {/* Información personal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Información Personal</Text>
            <Edit3 color="#FF9966" size={20} onPress={handleEditProfile} />
          </View>

          <View style={styles.infoRow}>
            <User color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{userData.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Cake color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={styles.infoValue}>{userData.birthDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Transgender color="#FF9966" size={20} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Género</Text>
              <Text style={styles.infoValue}>{userData.gender}</Text>
            </View>
          </View>
        </View>

        {/* Información física */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Física</Text>

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

        {/* Botones */}
        <Button
          size="lg"
          style={[styles.button, { backgroundColor: "#FF9966" }]}
          onPress={handleEditProfile}
        >
          Editar Perfil
        </Button>

        <Button
          size="lg"
          variant="outline"
          style={[styles.button, { borderColor: "#FF9966" }]}
          onPress={handleChangePassword}
          icon={Key}
        >
          Cambiar Contraseña
        </Button>

        <Button
          size="lg"
          variant="outline"
          style={[styles.button, { borderColor: "#E57373" }]}
          onPress={handleLogout}
          icon={LogOut}
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  title: {
    color: "#8B5A2B",
    fontWeight: "700",
    fontSize: 32,
  },
  subtitle: {
    color: "#A0522D",
    opacity: 0.8,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "#FFE5CC",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
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
});
