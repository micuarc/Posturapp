import { useEffect, useState, useCallback } from "react";
import { AppState } from "react-native";
import { SQLiteDatabase } from "expo-sqlite";
import { Lectura } from "./useWifiSensor";
import { useDatabase } from "./useDatabase";

export function useSyncPostura(db: SQLiteDatabase, lectura: Lectura | null, connected: boolean) {
  const { insertarLecturas } = useDatabase(db);
  const [batchLecturas, setBatchLecturas] = useState<Lectura[]>([]);
  const [listoParaGuardar, setListoParaGuardar] = useState(false);

    useEffect(() => {
    // evitar lecturas sin datos/datos quebrados
    if (!lectura) return;
    const estaCalibrando = lectura.calibrating === 1;
    if (estaCalibrando) {
      // sigue calibrando, no guardar
      setListoParaGuardar(false);
      return;
    }
  if (
    lectura.pitch == null ||
    lectura.roll == null ||
    lectura.malaPostura == null ||
    lectura.refPitch == null ||
    lectura.refRoll == null
  ) {
    return;
  }
    //1ra lectura luego de calibrar: comenzar guardado
    setListoParaGuardar(true);
    }, [lectura]);

    //ya que dejó de calibrar ,se puede comenzar a guardar registros para calibrar:
    useEffect(() => {
    if (!lectura) return;
    if (!connected) return;
    if (!listoParaGuardar) return;
    setBatchLecturas((p) => [...p, lectura]);
  }, [lectura, connected, listoParaGuardar]);

  //flush seguro
    const flush = useCallback(async () => {
       if (!listoParaGuardar) return;   
    if (!batchLecturas.length) return;

        const copia = [...batchLecturas];
    setBatchLecturas([]);

        try {
      await insertarLecturas(copia);
    } catch (e) {
      console.log("error flush:", e);
    }
  }, [batchLecturas, insertarLecturas, listoParaGuardar]);

 

  useEffect(() => {
  // const commitLecturas = (lecturas: Lectura[]) => {
  //   insertarLecturas(lecturas);
  // }
    // console.log(batchLecturas.length)
    if (batchLecturas.length > 20) {
      flush()
      // const batch = batchLecturas;
      // console.log(batch)
      // setBatchLecturas([]);
      // commitLecturas(batch)
    }
  }, [batchLecturas, flush]);
 
    useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") flush();
    });

    return () => sub.remove();
  }, [flush]);

  return {
    flush, listoParaGuardar
  }
}
