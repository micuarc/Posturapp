import { useEffect, useState, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { SQLiteDatabase } from "expo-sqlite";
import { Lectura } from "./useWifiSensor";
import { useDatabase } from "./useDatabase";
import { sensorEvents } from "@/helpers/events";

const MAX_BATCH = 20;

type Alerta = { hora: string; inicio: string; duracionSegundos: number | null };

const crearAlerta = (lectura: Lectura): Alerta => ({
  hora: new Date(lectura.timestamp).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  inicio: lectura.timestamp,
  duracionSegundos: null,
});

export function useSyncPostura(
  db: SQLiteDatabase,
  lectura: Lectura | null,
  connected: boolean
) {
  const { insertarLecturas } = useDatabase(db);
  const [listoParaGuardar, setListoParaGuardar] = useState(false);
  const lecturaAnterior = useRef<Lectura | null>(null);
  const [batchLecturas, setBatchLecturas] = useState<Lectura[]>([]);
  const alertaActiva = useRef<Alerta | null>(null);
  const isFlushing = useRef(false);
  const [alertasPendientes, setAlertasPendientes] = useState<Alerta[]>([]);

  useEffect(() => {
    if (!lectura) {
      lecturaAnterior.current = null;
      return;
    }
    const estaCalibrando = lectura.calibrating === 1;
    if (estaCalibrando) {
      // sigue calibrando, no guardar
      setListoParaGuardar(false);
      lecturaAnterior.current = null;
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
    if (!lectura || !connected || !listoParaGuardar) return;
    const prev = lecturaAnterior.current;
    const prevMal = prev?.malaPostura ?? 0;
    const estaEnAlerta = lectura.malaPostura === 1 && prevMal !== 1;
    const alertaTerminada = lectura.malaPostura === 0 && prev?.malaPostura === 1;

    if (estaEnAlerta) {
      const alerta = crearAlerta(lectura);
      alertaActiva.current = alerta;
      setAlertasPendientes((p) => [...p.filter(a => a.inicio !== alerta.inicio), alerta]);
      sensorEvents.emit("alerta", alerta);
    } else if (alertaTerminada && alertaActiva.current) {
      const inicio = new Date(alertaActiva.current.inicio).getTime();
      const fin = new Date(lectura.timestamp).getTime();
      const duracion = Math.max(1, Math.round((fin - inicio) / 1000));
      const alertaFinal = { ...alertaActiva.current, duracionSegundos: duracion };
      setAlertasPendientes((p) => [...p.filter(a => a.inicio !== alertaFinal.inicio), alertaFinal]);
      sensorEvents.emit("alerta", alertaFinal);
      alertaActiva.current = null;
    }

    setBatchLecturas((p) => [...p, lectura]);
    lecturaAnterior.current = lectura;
  }, [lectura, connected, listoParaGuardar]);

  //flush seguro
  const flush = useCallback(async () => {
    if (!listoParaGuardar || !batchLecturas.length || isFlushing.current) return;
    isFlushing.current = true;
    const copia = [...batchLecturas];
    setBatchLecturas([]);
    try {
      await insertarLecturas(copia);
      setAlertasPendientes([]);
      sensorEvents.emit("flush");
    } catch (e) {
      console.log("error flush:", e);
    } finally {
      isFlushing.current = false;
    }
  }, [batchLecturas, insertarLecturas, listoParaGuardar]);

  useEffect(() => {
    if (batchLecturas.length >= MAX_BATCH) {
      flush();
    }
  }, [batchLecturas, flush]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") flush();
    });

    return () => sub.remove();
  }, [flush]);

  return {
    flush,
    listoParaGuardar,
  };
}
