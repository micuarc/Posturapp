import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

let db: SQLite.SQLiteDatabase | null = null;

async function initDB() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("postura.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      minutos INTEGER,
      activaciones INTEGER
    );
  `);

  return db;
}

export function useDatabase() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDB();
      setReady(true);
    })();
  }, []);

  const insertarRegistro = async (minutos: number, activaciones: number) => {
    const database = await initDB();
    await database.runAsync(
      "INSERT INTO registros (fecha, minutos, activaciones) VALUES (?, ?, ?)",
      [new Date().toISOString(), minutos, activaciones]
    );
  };

  const obtenerRegistros = async () => {
    const database = await initDB();
    const result = await database.getAllAsync(
      "SELECT * FROM registros ORDER BY fecha DESC LIMIT 7"
    );
    return result; // devuelve array de objetos
  };

  return { ready, insertarRegistro, obtenerRegistros };
}
