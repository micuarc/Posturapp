import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

export interface Registro {
  id: number;
  fecha: string;
  minutos: number;
  activaciones: number;
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  malaPostura: number;
}

export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const database = await SQLite.openDatabaseAsync("postura.db");
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            minutos INTEGER,
            activaciones INTEGER,
            pitch REAL,
            roll REAL,
            refPitch REAL,
            refRoll REAL,
            malaPostura INTEGER
          );
        `);
        setDb(database);
        console.log("✅ Tabla 'registros' creada o existente");
      } catch (err) {
        console.error("Error inicializando DB:", err);
      }
    })();
  }, []);

  const guardar = async (
    minutos: number,
    activaciones: number,
    pitch: number,
    roll: number,
    refPitch: number,
    refRoll: number,
    malaPostura: number
  ) => {
    if (!db) return;
    try {
      await db.runAsync(
        `INSERT INTO registros (fecha, minutos, activaciones, pitch, roll, refPitch, refRoll, malaPostura)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          new Date().toISOString(),
          minutos,
          activaciones,
          pitch,
          roll,
          refPitch,
          refRoll,
          malaPostura,
        ]
      );
    } catch (err) {
      console.error("Error guardando registro:", err);
    }
  };

  const obtener = async (): Promise<Registro[]> => {
    if (!db) return [];
    try {
      return await db.getAllAsync("SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;");
    } catch (err) {
      console.error("Error obteniendo registros:", err);
      return [];
    }
  };

  return { guardar, obtener, ready: !!db };
}
