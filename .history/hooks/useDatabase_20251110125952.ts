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
    const database = SQLite.openDatabaseSync("postura.db");
    database.execSync(`
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
  }, []);

  const guardar = (
    minutos: number,
    activaciones: number,
    pitch: number,
    roll: number,
    refPitch: number,
    refRoll: number,
    malaPostura: number
  ) => {
    if (!db) return;
    db.runSync(
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
  };

  const obtener = (): Registro[] => {
    if (!db) return [];
    return db.getAllSync("SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;");
  };

  return { guardar, obtener };
}
