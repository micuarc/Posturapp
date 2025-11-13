import { useState, useEffect } from "react";
import { SQLiteDatabase } from "expo-sqlite";

export interface Perfil {
  id: number;
  email: string;
  password: string;
  salt: string;
  nombre: string | null;
  apellido: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  alturaCm: string | null;
  pesoKg: string | null;
  porcMusculo: string | null;
  porcGrasa: string | null;
  userIcon?: string | null;
}

export function useCargaPerfil(db: SQLiteDatabase, userId?: number) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPerfil = async () => {
    if (!userId) {
      console.log('No hay userId, saltando carga de perfil');
      setCargando(false);
      return;
    }

    try {
      console.log('Cargando perfil para usuario:', userId);
      setCargando(true);
      
      const result = await db.getFirstAsync<Perfil>(
        "SELECT * FROM usuarios WHERE id = ?",
        [userId]
      );

      console.log('Perfil cargado desde DB:', result);
      setPerfil(result || null);
    } catch (err) {
      console.error("Error cargando perfil:", err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const guardarPerfil = async (datos: {
    nombre?: string | null;
    apellido?: string | null;
    fechaNacimiento?: string | null;
    genero?: string | null;
    altura?: number | null;
    peso?: number | null;
    porcMusculo?: number | null;
    porcGrasa?: number | null;
    userIcon?: string | null;
  }) => {
    if (!userId) {
      console.error('No hay usuario para guardar');
      return { success: false, message: "No hay usuario" };
    }

    try {
      console.log('Guardando perfil para usuario:', userId);
      console.log('Datos a guardar:', datos);

      const result = await db.runAsync(
        `UPDATE usuarios SET 
          nombre = ?,
          apellido = ?,
          fechaNacimiento = ?,
          genero = ?,
          alturaCm = ?,
          pesoKg = ?,
          porcMusculo = ?,
          porcGrasa = ?,
          userIcon = ?
        WHERE id = ?`,
        [
          datos.nombre ?? null,
          datos.apellido ?? null,
          datos.fechaNacimiento ?? null,
          datos.genero ?? null,
          datos.altura?.toString() ?? null,
          datos.peso?.toString() ?? null,
          datos.porcMusculo?.toString() ?? null,
          datos.porcGrasa?.toString() ?? null,
          datos.userIcon?.toString() ?? null,
          userId
        ]
      );

      console.log('Resultado del UPDATE:', result);
      console.log('Filas afectadas:', result.changes);

      if (result.changes === 0) {
        console.warn('⚠️ No se actualizó ninguna fila');
        return { 
          success: false, 
          message: 'No se encontró el usuario o no hubo cambios' 
        };
      }

      await cargarPerfil();

      console.log('Perfil guardado y recargado exitosamente');
      return { success: true, message: "Perfil actualizado" };
      
    } catch (err) {
      console.error("Error guardando perfil:", err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Error al guardar' 
      };
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [userId]);

  return { perfil, cargando, error, cargarPerfil, guardarPerfil };
}