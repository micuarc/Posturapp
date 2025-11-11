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
  const [db, setDb] = useState<SQLite.WebSQLDatabase | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const database = SQLite.openDatabase("postura.db");
      setDb(database);

      database.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            minutos INTEGER,
            activaciones INTEGER,
            pitch REAL,
            roll REAL,
            refPitch REAL,
            refRoll REAL,
            malaPostura INTEGER
          );`,
          [],
          () => setReady(true),
          (_, err) => {
            console.error("Error creando tabla:", err);
            return false;
          }
        );
      });
    } catch (e) {
      console.error("Error inicializando DB:", e);
    }
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
    if (!db) {
      console.warn("Base de datos aún no lista, omitiendo guardado");
      return;
    }
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO registros 
         (fecha, minutos, activaciones, pitch, roll, refPitch, refRoll, malaPostura)
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
        ],
        undefined,
        (_, err) => {
          console.error("Error guardando registro:", err);
          return true;
        }
      );
    });
  };

  const obtener = async (): Promise<Registro[]> => {
    return new Promise(resolve => {
      if (!db) {
        resolve([]);
        return;
      }
      db.transaction(tx => {
        tx.executeSql(
          "SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;",
          [],
          (_, { rows }) => resolve(rows._array as Registro[])
        );
      });
    });
  };

  return { guardar, obtener, ready };
}
