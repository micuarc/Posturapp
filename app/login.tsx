import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Heart } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import AuthUsuario from '@/helpers/AuthUsuario';
import { useAuth } from '@/helpers/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { loginUsuario } = AuthUsuario(db);
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Por favor, ingresa todos los campos requeridos.");
      return;
    }

    setCargando(true);

    try {
      const result = await loginUsuario(email, password);

      if (result.success && result.user) {
        await login(result.user);
        Alert.alert("Credenciales correctas. Entrando...", result.message);
        router.replace('/(tabs)');
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Error al iniciar sesión");
      console.error("Error en el login:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Heart color="#FF9966" size={40} />
          </View>
          <Text style={styles.title}>Posturapp</Text>
          <Text style={styles.subtitle}>Monitoreo de postura cervical</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>
          <Text style={styles.cardSubtitle}>Accede a tu cuenta para continuar</Text>

          <View style={styles.inputRow}>
            <Mail color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0522D"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!cargando}
            />
          </View>

          <View style={styles.inputRow}>
            <Lock color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#A0522D"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!cargando}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff color="#FF9966" size={24} />
              ) : (
                <Eye color="#FF9966" size={24} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { 
                backgroundColor: pressed || cargando ? '#e6854f' : '#FF9966',
                opacity: cargando ? 0.7 : 1 
              },
            ]}
            onPress={handleLogin}
            disabled={cargando}
          >
            <Text style={styles.loginText}>
              {cargando ? 'Iniciando...' : 'Iniciar Sesión'}
            </Text>
          </Pressable>

          <Pressable onPress={() => console.log('Forgot password pressed')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.signupLabel}>¿No tienes una cuenta?</Text>
          <Pressable
            style={({ pressed }) => [
              styles.signupButton,
              { backgroundColor: pressed ? '#FFEDE0' : 'transparent' },
            ]}
            onPress={() => router.push('./registro')}
            disabled={cargando}
          >
            <Text style={styles.signupText}>Crear Cuenta</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  inner: { padding: 24, marginTop: 48 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFE5CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#8B5A2B', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#A0522D', textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE5CC',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#8B5A2B', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { color: '#A0522D', textAlign: 'center', marginBottom: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  input: { flex: 1, color: '#8B5A2B', fontSize: 16, marginLeft: 8 },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loginText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  forgotText: { color: '#FF9966', textAlign: 'center'},
  signupLabel: { color: '#8B5A2B', textAlign: 'center', marginBottom: 16 },
  signupButton: {
    borderWidth: 2,
    borderColor: '#FF9966',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  signupText: { color: '#FF9966', fontSize: 18, fontWeight: 'bold' },
});
