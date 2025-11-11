import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import { Lectura } from "./useWifiSensor";

export interface Registro {
  id?: number;
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

  const iniciarConexion = async (database: SQLite.SQLiteDatabase) => {
    if (db) return;
    try {
      await database.runAsync(
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
          );`
      );
    } catch (e) {
      console.error("Error inicializando DB:", e);
    }
  };

  const guardar = async (
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
    try {
      await db.runAsync(
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
        ]
      );
    } catch (e) {
      console.log(e);
    }
  };

  const insertarLecturas = async (lecturas: Lectura[]): Promise<void> => {
    if (!lecturas.length) return;
    if (db === null) {
      console.warn("insertarLecturas db is null");
      return;
    }

    let sql = `INSERT INTO registros(fecha, minutos, activaciones, pitch, roll, refPitch, refRoll, malaPostura)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log("prepare");
    const prepared = await db.prepareAsync(sql);
    console.log("prepared");
    try {
      await db.withExclusiveTransactionAsync(async () => {
        console.log("empieza transaccion");
        await lecturas.reduce(async (promise, lectura, i) => {
          await promise;
          console.log('empieza query: ', i)
          await prepared.executeAsync([
            new Date().toISOString(),
            0,
            0,
            lectura.pitch,
            lectura.roll,
            lectura.refPitch,
            lectura.refRoll,
            lectura.bad,
          ]);
          console.log('termina query: ', i)
        }, Promise.resolve());
      });
    } catch (e) {
      console.log("error in batch");
      console.log(e);
    } finally {
      prepared.finalizeAsync();
    }
  };

  const obtener = async (): Promise<Registro[]> => {
    await iniciarConexion();
    if (!db) {
      console.warn("Base de datos aún no lista, omitiendo guardado");
      return [];
    }
    let registros: Registro[] = [];
    try {
      registros = (await db.getAllAsync(
        "SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;"
      )) as Registro[];
    } catch (e) {
      console.log(e);
    }
    return registros;
  };
  return { guardar, obtener, ready, db, insertarLecturas, iniciarConexion };
}
