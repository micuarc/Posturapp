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
}

export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    (async () => {
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
          refRoll REAL
        );
      `);
      setDb(database);
    })();
  }, []);

  const guardar = async (
    minutos: number,
    activaciones: number,
    pitch: number,
    roll: number,
    refPitch: number,
    refRoll: number
  ) => {
    if (!db) return;
    await db.runAsync(
      `INSERT INTO registros (fecha, minutos, activaciones, pitch, roll, refPitch, refRoll)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [new Date().toISOString(), minutos, activaciones, pitch, roll, refPitch, refRoll]
    );
  };

  const obtener = async (): Promise<Registro[]> => {
    if (!db) return [];
    return await db.getAllAsync("SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;");
  };

  return { guardar, obtener };
}
