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

  const iniciarConexion = async () => {
    if (db) return;
    try {
        const database = await SQLite.openDatabaseAsync("postura.db");
        setDb(database);
        setReady(true);
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
    await iniciarConexion();
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
          ],
      );
    } catch (e) {
      console.log(e)
    }
  };

  const insertarLecturas = async (lecturas: Lectura[]): Promise<boolean> => {
    if (!lecturas.length) return false;

    let sql = `INSERT INTO registros(fecha, minutos, activaciones, pitch, roll, refPitch, refRoll, malaPostura)
      VALUES `;
    const delim = '(?, ?, ?, ?, ?, ?, ?, ?)';

    const data: Registro[] = [];
    
    lecturas.forEach((v) => {
      sql += delim + ', ';
      data.push({
        fecha: new Date().toISOString(),
        malaPostura: v.bad,
        activaciones: 0,
        minutos: 0,
        ...v,
      });
    });

    sql+= ';';

    return true;
  }

  const obtener = async (): Promise<Registro[]> => {
    await iniciarConexion();
     if (!db) {
      console.warn("Base de datos aún no lista, omitiendo guardado");
      return [];
    }
    let registros: Registro[] = [];
    try {
      registros = await db.getAllAsync("SELECT * FROM registros ORDER BY fecha DESC LIMIT 50;") as Registro[]
    } catch (e) {
      console.log(e)
    }
    return registros;
  };
  return { guardar, obtener, ready, db };
}
