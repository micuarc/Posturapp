import * as SQLite from "expo-sqlite";
import { useEffect } from "react";

const db = SQLite.openDatabase("postura.db");

export function useDatabase() {
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS registros (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT,
          minutos INTEGER,
          activaciones INTEGER
        );
      `);
    });
  }, []);

  const insertarRegistro = (minutos: number, activaciones: number) => {
    db.transaction(tx => {
      tx.executeSql(
        "INSERT INTO registros (fecha, minutos, activaciones) VALUES (?, ?, ?);",
        [new Date().toISOString(), minutos, activaciones]
      );
    });
  };

  const obtenerRegistros = (callback: (rows: any[]) => void) => {
    db.transaction(tx => {
      tx.executeSql(
        "SELECT * FROM registros ORDER BY fecha DESC LIMIT 7;",
        [],
        (_, { rows }) => callback(rows._array)
      );
    });
  };

  return { insertarRegistro, obtenerRegistros };
}
