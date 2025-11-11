import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

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
      `INSERT INTO registros 
        (fecha, minutos,
