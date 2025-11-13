import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import { Lectura } from "./useWifiSensor";
import { useAuth } from "@/helpers/AuthContext";

export interface Registro {
  id?: number;
  fecha: string;
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  malaPostura: number;
  userId: number | null;
}


export function useDatabase(db: SQLite.SQLiteDatabase) {
  const { usuario } = useAuth();

  const guardar = async (lectura : Lectura | null) => {
    if (!db) {
      console.warn("Base de datos aún no lista, omitiendo guardado");
      return;
    }
    if (!lectura) {
      console.warn("Lectura no regisqtrada, omitiendo guardado");
      return;
    }
    const userId = usuario?.id ?? null;
    if (lectura.calibrating === 1) return;

    try {
      await db.runAsync(
        `INSERT INTO registros 
          (fecha, pitch, roll, refPitch, refRoll, malaPostura, userId)
          VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          lectura.timestamp,
          lectura.pitch,
          lectura.roll,
          lectura.refPitch,
          lectura.refRoll,
          lectura.malaPostura,
          userId,
        ]
      );
    } catch (e) {
      console.log("Error al guardar regsitro: ", e);
    }
  };

  const insertarLecturas = async (lecturas: Lectura[]): Promise<void> => {
    const userId = usuario?.id ?? null;
    if (!lecturas.length) return;
    if (db === null) {
      console.warn("insertarLecturas db is null");
      return;
    }

    let sql = `INSERT INTO registros(fecha, pitch, roll, refPitch, refRoll, malaPostura, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // prepared sql: pone string del sql en cache, mejora el rendimiento (ejecucion + rpáida)
    const prepared = await db.prepareAsync(sql);
    console.log("prepared");
    
    try {
      await db.withExclusiveTransactionAsync(async () => {
        console.log("empieza transaccion");
        // foreach no funciona con async
        // usamos reduce para esperar varias promesas en loop
        await lecturas.reduce(async (promise, lectura, i) => {
          await promise;
          console.log('empieza query: ', i)
          await prepared.executeAsync([
            lectura.timestamp,
            lectura.pitch,
            lectura.roll,
            lectura.refPitch,
            lectura.refRoll,
            lectura.malaPostura === 1 ? 1 : 0,
            userId,
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
    const userId = usuario?.id ?? null;
    if (!db) {
      console.warn("Base de datos aún no lista, omitiendo guardado");
      return [];
    }
    let registros: Registro[] = [];
    try {
      registros = (await db.getAllAsync("SELECT * FROM registros WHERE fecha >= date('now', 'start of day') ORDER BY fecha ASC;"
, [userId])) as Registro[];
    } catch (e) {
      console.log(e);
    }
    return registros;
  };
  return { guardar, obtener, insertarLecturas };
}
