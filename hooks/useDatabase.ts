import { useCallback } from "react";
import * as SQLite from "expo-sqlite";
import { Lectura } from "./useWifiSensor";
import { useAuth } from "@/helpers/AuthContext";
export interface Registro {
  id?: number;
  fecha: string;
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  malaPostura: number;
  userId: number | null;
}

export function useDatabase(db: SQLite.SQLiteDatabase) {
  const { usuario } = useAuth();

  const insertarLecturas = useCallback(
    async (lecturas: Lectura[]): Promise<void> => {
      if (!db || !lecturas.length) return;
      if (!usuario?.id) {
        console.warn("insertarLecturas: usuario no definido");
        return;
      }

      const stmt = await db.prepareAsync(
        `INSERT INTO registros (
          fecha,
          pitch,
          roll,
          refPitch,
          refRoll,
          malaPostura,
          userId
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`
      );

      try {
        await db.withExclusiveTransactionAsync(async () => {
          for (const lectura of lecturas) {
            await stmt.executeAsync([
              lectura.timestamp,
              lectura.pitch,
              lectura.roll,
              lectura.refPitch,
              lectura.refRoll,
              lectura.malaPostura === 1 ? 1 : 0,
              usuario.id,
            ]);
          }
        });
      } catch (error) {
        console.error("insertarLecturas falló", error);
        throw error;
      } finally {
        await stmt.finalizeAsync();
      }
    },
    [db, usuario?.id]
  );

  const obtener = useCallback(async (): Promise<Registro[]> => {
    if (!db || !usuario?.id) return [];
    try {
      return (await db.getAllAsync(
        `SELECT *
         FROM registros
         WHERE userId = ?
           AND datetime(fecha) >= datetime('now','localtime','-28 days')
         ORDER BY datetime(fecha) DESC;`,
        [usuario.id]
      )) as Registro[];
    } catch (error) {
      console.error("obtener() falló", error);
      return [];
    }
  }, [db, usuario?.id]);

  return { insertarLecturas, obtener };
}
