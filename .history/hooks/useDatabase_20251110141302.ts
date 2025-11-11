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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Espera un microtick para que expo-modules cargue bien
        await new Promise((r) => setTimeout(r, 500));

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
        if (mounted) {
          setDb(database);
          setReady(true);
          console.log("✅ DB lista");
        }
      } catch (e) {
        console.error("❌ Error inicializando DB:", e);
      }
    })();

    return () => {
      mounted = false;
    };
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
    if (!db || !ready) {
      console.warn("⏳ Intento de guardar antes de que DB esté lista");
      return;
    }

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
      console.log("✅ Registro guardado");
    } catch (e) {
      console.error("❌ Error guardando registro:", e);
    }
  };

  const obtener = async (): Promise<Registro[]> => {
    if (!db || !ready) return [];
    try {
      return await db.getAllAsync(
        "SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;"
      );
    } catch (e) {
      console.error("❌ Error leyendo registros:", e);
      return [];
    }
  };

  return { guardar, obtener, ready };
}
