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
          activaciones INTEGER
        );
      `);
      setDb(database);
    })();
  }, []);

  const guardar = async (minutos: number, activaciones: number) => {
    if (!db) return;
    await db.runAsync(
      "INSERT INTO registros (fecha, minutos, activaciones) VALUES (?, ?, ?)",
      [new Date().toISOString(), minutos, activaciones]
    );
  };

  const obtener = async () => {
    if (!db) return [];
    return await db.getAllAsync("SELECT * FROM registros ORDER BY fecha DESC LIMIT 7;");
  };

  return { guardar, obtener };
}
