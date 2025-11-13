import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import AuthUsuario from '@/helpers/AuthUsuario';

export default function SignUpScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { registrarUsuario } = AuthUsuario(db);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!termsAccepted) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones");
      return;
    }
    
    if (!firstName.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "El email es obligatorio");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor, ingresa un email válido");
      return;
    }

    setLoading(true);
    
    try {
      const result = await registrarUsuario(email, password);
      
      if (result.success) {
        Alert.alert("Éxito", result.message, [
          { text: "OK", onPress: () => router.replace('/login') }
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", "Error inesperado al crear la cuenta");
    } finally {
      setLoading(false);
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
          <Text style={styles.subtitle}>Regístrate para comenzar</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear cuenta</Text>
          <Text style={styles.cardSubtitle}>Completa los campos para continuar</Text>

          <View style={styles.inputRow}>
            <User color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Nombre (obligatorio)"
              placeholderTextColor="#A0522D"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputRow}>
            <User color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Apellido (opcional)"
              placeholderTextColor="#A0522D"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputRow}>
            <Mail color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#A0522D"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputRow}>
            <Lock color="#FF9966" size={24} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor="#A0522D"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
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
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={styles.termsContainer}
            disabled={loading}
          >
            <View
              style={[
                styles.checkbox,
                { backgroundColor: termsAccepted ? '#FF9966' : 'transparent' },
              ]}
            >
              {termsAccepted && (
                <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center' }}>✓</Text>
              )}
            </View>
            <Text style={styles.termsText}>
              Acepto los términos y condiciones
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              {
                backgroundColor: pressed || !termsAccepted || loading ? '#FFD2B3' : '#FF9966',
                opacity: loading ? 0.7 : 1
              },
            ]}
            onPress={handleSignUp}
            disabled={!termsAccepted || loading}
          >
            <Text
              style={[
                styles.loginText,
                { color: termsAccepted && !loading ? '#FFF' : '#A0522D' },
              ]}
            >
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </Text>
          </Pressable>

          <Pressable 
            onPress={() => router.push('/login')}
            disabled={loading}
          >
            <Text style={styles.forgotText}>
              ¿Ya tienes una cuenta? Inicia sesión
            </Text>
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
  loginText: { fontSize: 18, fontWeight: 'bold' },
  forgotText: { color: '#FF9966', textAlign: 'center' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FF9966',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
  },
  termsText: { color: '#8B5A2B', fontSize: 15 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    marginTop: 8,
  },
});
