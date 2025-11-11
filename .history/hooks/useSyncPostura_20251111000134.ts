import { useEffect, useState } from "react";
import { useDatabaseSelector } from "./useDatabaseSelector";
import { useWifiSensor } from "./useWifiSensor";
import { useDatabase } from "./useDatabase";
import { useSQLiteContext } from "expo-sqlite";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number; // 1 = mala postura, 0 = buena
  calibrating?: number; // 1 = calibrando, 0 = normal
}

export function useSyncPostura(lectura: Lectura | null, connected: boolean) {
   const db = useSQLiteContext();
    const { insertarLecturas } = useDatabase(db);
  const [batchLecturas, setBatchLecturas] = useState<Lectura[]>([]);

  useEffect(() => {
    if(!lectura) return;
    setBatchLecturas((p) => [...p, lectura]);
  }, [lectura]);

  useEffect(() => {
    const commitLecturas = (lecturas: Lectura[]) => {
      insertarLecturas(lecturas);
    }
    // console.log(batchLecturas.length)
    if (batchLecturas.length > 20) {
      const batch = batchLecturas;
      console.log(batch)
      setBatchLecturas([]);
      commitLecturas(batch)
    }
  }, [batchLecturas]);

  return {
    lectura,
    connected,
  };
}
