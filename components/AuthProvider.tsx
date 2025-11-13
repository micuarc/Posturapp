import React, { useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext, { Usuario, AuthContextType } from '@/helpers/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAuthActual();
  }, []);

  const cargarAuthActual = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem('usuario');
      if (usuarioGuardado) {
        const userData = JSON.parse(usuarioGuardado);
        setUsuario(userData);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const login = async (datosUsuario: Usuario): Promise<void> => {
    try {
      setUsuario(datosUsuario);
      await AsyncStorage.setItem('usuario', JSON.stringify(datosUsuario));
    } catch (error) {
      console.error('Error guardando usuario:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUsuario(null);
      await AsyncStorage.removeItem('usuario');
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    usuario,
    login,
    logout,
    cargando
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}