import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { ScrollView } from '@/components/ui/scroll-view';
import { useRouter } from 'expo-router';
import { useAuth } from '@/helpers/AuthContext';
import { Heart, User, Activity, TrendingUp, LogOut, Settings, Edit3 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function HomeScreen() {
  const router = useRouter();
  const { usuario, logout, cargando } = useAuth();

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? 'Buenos días' :
    hora < 19 ? 'Buenas tardes' :
    'Buenas noches';

  if (cargando) {
    return (
      <View style={[styles.container, styles.center]}>
        <Heart color="#FF9966" size={48} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

if (!usuario) {
  return (
    <View style={styles.container}>
      <View style={styles.welcomeContainer}>
        <View style={styles.iconCircle}>
          <Heart color="#FF9966" size={48} />
        </View>
        <Text style={styles.welcomeTitle}>Bienvenido a Posturapp</Text>
        <Text style={styles.welcomeSubtitle}>
          Monitorea tu postura cervical y mejora tu salud
        </Text>
        
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push('/(tabs)/../login' as any)}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
        
        <Pressable
          style={styles.registerButton}
          onPress={() => router.push('/(tabs)/../registro' as any)}
        >
          <Text style={styles.registerText}>Crear Cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}

  // usuario auth, mostrar dashboard
  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Cerrar Sesión", 
        onPress: async () => {
          await logout();
          router.replace("/(tabs)/monitoreo");
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>¡{saludo}!</Text>
            <Text style={styles.subtitle}>¿Cómo está tu postura hoy?</Text>
          </View>
          <Button
            icon={(props) => <LogOut {...props} color="#FF9966" />}
            size="icon"
            style={styles.headerIcon}
            onPress={handleLogout}
          />
        </View>

        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/monitoreo')}
          >
            <Activity color="#FF9966" size={32} />
            <Text style={styles.actionTitle}>Iniciar Monitoreo</Text>
            <Text style={styles.actionSubtitle}>Comienza a supervisar tu postura</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <TrendingUp color="#FF9966" size={32} />
            <Text style={styles.actionTitle}>Ver Métricas</Text>
            <Text style={styles.actionSubtitle}>Revisa tu progreso</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/perfil')}
          >
            <User color="#FF9966" size={32} />
            <Text style={styles.actionTitle}>Mi Perfil</Text>
            <Text style={styles.actionSubtitle}>Actualiza tu información</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/configuracion')}
          >
            <Settings color="#FF9966" size={32} />
            <Text style={styles.actionTitle}>Configuración</Text>
            <Text style={styles.actionSubtitle}>Ajustar feedback del sensor</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  inner: {
    paddingHorizontal: 24
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: "#FFE5CC",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 18,
    color: '#8B5A2B',
    marginTop: 16,
  },
  loginButton: {
    backgroundColor: '#FF9966',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#FF9966',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
  },
  registerText: {
    color: '#FF9966',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    marginTop: 60,
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
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
  headerIcon: {
    backgroundColor: "#FFF0E6",
    borderWidth: 1,
    borderColor: "#FFDCC7",
    borderRadius: 999,
  },
  actionsContainer: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE5CC',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#A0522D',
    textAlign: 'center',
  },
});