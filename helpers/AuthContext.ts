import React, { createContext } from 'react';

export interface Usuario {
  id: number;
  email: string;
  nombre?: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  login: (usuario: Usuario) => Promise<void>;
  logout: () => Promise<void>;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;