import { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from 'expo-crypto';

interface Usuario {
  id: number;
  email: string;
}

interface AuthResult {
  success: boolean;
  message: string;
  user?: Usuario;
}

const generarSalt = async (): Promise<string> => {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    
    const hexString = randomBytes.reduce((hex, byte) => {
      return hex + byte.toString(16).padStart(2, '0');
    }, '');
    
    return hexString;
  } catch (error) {
    console.error("Error generando salt con expo-crypto:", error);
    
    const fallbackSalt = Date.now().toString(36) + Math.random().toString(36).substring(2);
    return fallbackSalt.substring(0, 32); 
  }
};

const hashearPassword = async (password: string, salt: string): Promise<string> => {
  try {
    if (!password || !salt) {
      throw new Error("Password y salt son requeridos");
    }

    const dataToHash = `${password}${salt}`;
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToHash,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    if (!hash || typeof hash !== 'string') {
      throw new Error("Hash inválido generado");
    }
    
    return hash.toLowerCase(); 
  } catch (error) {
    console.error("Error hasheando contraseña:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error procesando contraseña: ${message}`);
  }
};

const verificarPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  try {
    if (!password || !hash || !salt) {
      console.error("Parámetros inválidos para verificación");
      return false;
    }

    const hashCalculado = await hashearPassword(password, salt);
    
    return hashCalculado.toLowerCase() === hash.toLowerCase();
  } catch (error) {
    console.error("Error verificando contraseña:", error);
    return false;
  }
};

export default function AuthUsuario(db: SQLiteDatabase) {
  const registrarUsuario = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!email?.trim() || !password?.trim()) {
        return { success: false, message: "Email y contraseña son obligatorios" };
      }

      if (password.length < 6) {
        return { success: false, message: "La contraseña debe tener al menos 6 caracteres" };
      }

      if (password.length > 128) {
        return { success: false, message: "La contraseña es demasiado larga" };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: "Formato de email inválido" };
      }

      const usuarioExistente = await db.getFirstAsync(
        "SELECT id FROM usuarios WHERE email = ?",
        [email.toLowerCase()]
      );

      if (usuarioExistente) {
        return { success: false, message: "Este email ya está registrado" };
      }

      console.log("Generando salt...");
      const salt = await generarSalt();
      
      console.log("Hasheando contraseña...");
      const passwordHash = await hashearPassword(password, salt);

      console.log(`Salt generado: ${salt.substring(0, 8)}... (${salt.length} caracteres)`);
      console.log(`Hash generado: ${passwordHash.substring(0, 8)}... (${passwordHash.length} caracteres)`);

      const result = await db.runAsync(
        `INSERT INTO usuarios (email, password, salt) VALUES (?, ?, ?)`,
        [email.toLowerCase(), passwordHash, salt]
      );

      if (result.lastInsertRowId) {
        console.log("Usuario creado exitosamente con ID:", result.lastInsertRowId);
        return {
          success: true,
          message: "Usuario registrado exitosamente",
          user: {
            id: result.lastInsertRowId,
            email: email.toLowerCase()
          }
        };
      } else {
        return { success: false, message: "Error al crear el usuario en la base de datos" };
      }

    } catch (error) {
      console.error("Error en registro de usuario:", error);
      
      let message = "Error interno del servidor";
      if (error instanceof Error) {
        if (error.message.includes("Hash")) {
          message = "Error procesando la contraseña";
        } else if (error.message.includes("database")) {
          message = "Error de base de datos";
        }
      }
      
      return { success: false, message };
    }
  };

  const loginUsuario = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!email?.trim() || !password?.trim()) {
        return { success: false, message: "Email y contraseña son obligatorios" };
      }

      const usuario = await db.getFirstAsync(
        "SELECT id, email, password, salt FROM usuarios WHERE email = ?",
        [email.toLowerCase()]
      ) as { id: number; email: string; password: string; salt: string } | null;

      if (!usuario) {
        return { success: false, message: "Email o contraseña incorrectos" };
      }

      if (!usuario.password || !usuario.salt) {
        console.error("Usuario sin password o salt válidos");
        return { success: false, message: "Error de datos del usuario" };
      }

      console.log(`Verificando login para: ${email}`);
      console.log(`Salt del usuario: ${usuario.salt.substring(0, 8)}... (${usuario.salt.length} caracteres)`);

      const passwordValido = await verificarPassword(password, usuario.password, usuario.salt);

      if (!passwordValido) {
        return { success: false, message: "Email o contraseña incorrectos" };
      }

      // auth exitoso. pasara al authprovider x loginUsuario
      return {
        success: true,
        message: "Login exitoso",
        user: {
          id: usuario.id,
          email: usuario.email
        }
      };

    } catch (error) {
      console.error("Error en login de usuario:", error);
      return { 
        success: false, 
        message: "Error interno del servidor" 
      };
    }
  };

  const cambiarPassword = async (userId: number, passwordActual: string, passwordNueva: string): Promise<AuthResult> => {
    try {
      if (!passwordActual?.trim() || !passwordNueva?.trim()) {
        return { success: false, message: "Contraseña actual y nueva son obligatorias" };
      }

      if (passwordNueva.length < 6) {
        return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres" };
      }

      if (passwordNueva.length > 128) {
        return { success: false, message: "La nueva contraseña es demasiado larga" };
      }

      const usuario = await db.getFirstAsync(
        "SELECT password, salt FROM usuarios WHERE id = ?",
        [userId]
      ) as { password: string; salt: string } | null;

      if (!usuario) {
        return { success: false, message: "Usuario no encontrado" };
      }

      const passwordValido = await verificarPassword(passwordActual, usuario.password, usuario.salt);

      if (!passwordValido) {
        return { success: false, message: "Contraseña actual incorrecta" };
      }

      const nuevoSalt = await generarSalt();
      const nuevoPasswordHash = await hashearPassword(passwordNueva, nuevoSalt);

      await db.runAsync(
        "UPDATE usuarios SET password = ?, salt = ? WHERE id = ?",
        [nuevoPasswordHash, nuevoSalt, userId]
      );

      return {
        success: true,
        message: "Contraseña cambiada exitosamente"
      };

    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      return { 
        success: false, 
        message: "Error interno del servidor" 
      };
    }
  };

  return {
    registrarUsuario,
    loginUsuario,
    cambiarPassword
  };
}
