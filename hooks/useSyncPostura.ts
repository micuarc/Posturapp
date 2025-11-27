import { useEffect, useState, useCallback, useRef } from "react";
import { AppState, NativeModules } from "react-native";
import { SQLiteDatabase } from "expo-sqlite";
import { Lectura } from "./useWifiSensor";
import { useDatabase } from "./useDatabase";
import { sensorEvents } from "@/helpers/events";
import { useSQLiteContext } from "expo-sqlite";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/helpers/AuthContext";
import { vibrate } from "@/helpers/postura";
import { vibrateSensor } from "@/helpers/sensorApi";

const { Postura } = NativeModules;

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
  connected: boolean,
  sensorIp: string | null
) {
  const sqlite = useSQLiteContext();
  const { insertarLecturas } = useDatabase(db);

  const [listoParaGuardar, setListoParaGuardar] = useState(false);
  const lecturaAnterior = useRef<Lectura | null>(null);
  const [batchLecturas, setBatchLecturas] = useState<Lectura[]>([]);
  const alertaActiva = useRef<Alerta | null>(null);
  const remoteVibrationSent = useRef(false);
  useEffect(() => {
    console.log('[DEBUG] alertaActiva changed:', alertaActiva.current);
  }, [alertaActiva.current]);
  const isFlushing = useRef(false);
  const [alertasPendientes, setAlertasPendientes] = useState<Alerta[]>([]);

    const [feedback, setFeedback] = useState<string[]>([]);

    useEffect(() => {
      let isMounted = true;
      const loadFeedback = async () => {
        try {
          const row = await sqlite.getFirstAsync<{ value: string }>(
            "SELECT value FROM configuracion WHERE key = 'feedback_type'"
          );
          const parsed = row?.value ? JSON.parse(row.value) : ["vibration"];
          if (isMounted) setFeedback(parsed);
        } catch (e) {
          console.log("Error leyendo feedback_type:", e);
        }
      };
      loadFeedback();
      const interval = setInterval(loadFeedback, 1000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [sqlite]);

    useEffect(() => {
      Notifications.requestPermissionsAsync();
    }, []);

  //calibracion sensor
  useEffect(() => {
    if (!lectura) {
      lecturaAnterior.current = null;
      console.log("useSyncPostura calibracion: no lectura");
      return;
    }

    const estaCalibrando = lectura.calibrating === 1;
    if (estaCalibrando) {
      // sigue calibrando, no guardar
      console.log("useSyncPostura calibracion: ESP32 está calibrando...");
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
      console.log("useSyncPostura calibracion: datos incompletos", lectura);
      return;
    }

    const calibrado = lectura.refPitch !== 0 || lectura.refRoll !== 0;
    if (!calibrado) {
      console.log("useSyncPostura calibracion: ESP32 NO calibrado (ref=0)");
      setListoParaGuardar(false);
      return;
    }

    //1ra lectura luego de calibrar: comenzar guardado
    console.log("useSyncPostura: ESP32 calibrado, listoParaGuardar=true");
    setListoParaGuardar(true);
  }, [lectura]);

  //ya que dejó de calibrar ,se puede comenzar a guardar registros para calibrar:
  useEffect(() => {
    if (!lectura || !connected || !listoParaGuardar) {
      console.log(
        "useSyncPostura: skip -",
        { hasLectura: !!lectura, connected, listoParaGuardar }
      );

        if (alertaActiva.current) {
          console.log('[DEBUG] Limpiando alertaActiva por desconexión/calibración');
          alertaActiva.current = null;
          if (remoteVibrationSent.current) {
            remoteVibrationSent.current = false;
            console.log('[DEBUG] remoteVibrationSent limpiado por desconexión/calibración');
          }
        }

      return;
    }
    const lecturaTimestamp = new Date(lectura.timestamp).getTime();
    const now = Date.now();
    const lecturaAge = now - lecturaTimestamp;

    if (lecturaAge > 3000) {
      console.log(` lctura antigua, ignorando`);
      return;
    }

    const prev = lecturaAnterior.current;
    const prevMal = prev?.malaPostura ?? 0;
    const estaEnAlerta = lectura.malaPostura === 1 && prevMal !== 1;
    const alertaTerminada = lectura.malaPostura === 0 && prev?.malaPostura === 1;

    const malaAhora = lectura.malaPostura === 1;

    console.log("useSyncPostura: procesando lectura", {
      malaAhora,
      prevMal,
      nuevaLectura: lectura.malaPostura,
      estaEnAlerta,
      alertaTerminada,
      batchSize: batchLecturas.length,
      age: `${(lecturaAge / 1000).toFixed(1)}s`,
    });

    //feedback al activar alerta
    if (estaEnAlerta) {
      console.log("🔥 ALERTA ACTIVADA - Mala postura detectada!");
      const alerta = crearAlerta(lectura);
      console.log(`[VIBRATION] feedback: ${JSON.stringify(feedback)}, sensorIp: ${sensorIp}`);
      if (feedback.includes("vibration")) {
        if (Postura?.vibrate) {
          try {
            console.log("Vibrando dispositivo local...");
            vibrate();
          } catch (e) {
            console.log("Error vibración:", e);
          }
        }
        if (sensorIp) {
          console.log(`[VIBRATION] Enviando vibrateSensor a ${sensorIp} (malaPostura=${lectura.malaPostura}, prevMal=${prevMal})`);
          if (!remoteVibrationSent.current) {
            remoteVibrationSent.current = true;
            (async () => {
              try {
                const ok = await vibrateSensor(sensorIp);
                console.log(`[VIBRATION] Resultado vibrateSensor: ${ok}`);
                if (!ok) {
                  remoteVibrationSent.current = false;
                }
              } catch (e) {
                console.log('[VIBRATION] Error vibrateSensor:', e);
                remoteVibrationSent.current = false;
              }
            })();
          } else {
            console.log('[VIBRATION] vibrateSensor ya fue enviado, omitiendo reenvío');
          }
        } else {
          console.log("[VIBRATION] sensorIp no definido, no se puede enviar vibración remota");
        }
      } else {
        console.log("Vibración desactivada por configuración de feedback");
      }
      if (feedback.includes("sound") && NativeModules.SoundService?.playSound) {
        try {
          NativeModules.SoundService.playSound("sonido_alerta");
        } catch (e) {
          console.log("Error sonido:", e);
        }
      }

      if (feedback.includes("notification") && NativeModules.NotificationService?.showNotification) {
        try {
          NativeModules.NotificationService.showNotification(
            "Postura incorrecta",
            "Toma un momento para corregir tu postura"
          );
        } catch (e) {
          console.log("Error notificación nativa:", e);
        }
      }
      alertaActiva.current = alerta;
      console.log('[DEBUG] alertaActiva asignada:', alertaActiva.current);
      setAlertasPendientes((p) => [
        ...p.filter((a) => a.inicio !== alerta.inicio),
        alerta,
      ]);
      sensorEvents.emit("alerta", alerta);
    }

    console.log('[ALERTA] Verificando fin de alerta:', {
      alertaTerminada,
      alertaActiva: alertaActiva.current,
      lectura,
      prevMal,
      nuevaLectura: lectura.malaPostura
    });
    if (alertaTerminada && alertaActiva.current) {
      const inicio = new Date(alertaActiva.current.inicio).getTime();
      const fin = new Date(lectura.timestamp).getTime();
      const duracion = Math.max(1, Math.round((fin - inicio) / 1000));

      const alertaFinal = {
        ...alertaActiva.current,
        duracionSegundos: duracion,
      };

      setAlertasPendientes((p) => [
        ...p.filter((a) => a.inicio !== alertaFinal.inicio),
        alertaFinal,
      ]);

      if (sensorIp) {
        import("@/helpers/sensorApi").then(async ({ stopVibration }) => {
          console.log(`[VIBRATION] Enviando stopVibration a ${sensorIp}`);
          const ok = await stopVibration(sensorIp);
          console.log(`[VIBRATION] Resultado stopVibration: ${ok}`);
          if (remoteVibrationSent.current) {
            remoteVibrationSent.current = false;
            console.log('[VIBRATION] remoteVibrationSent limpiado');
          }
        });
      }

      sensorEvents.emit("alerta", alertaFinal);
      console.log('[DEBUG] alertaActiva finalizada:', alertaActiva.current);
      alertaActiva.current = null;
    }

    setBatchLecturas((p) => [...p, lectura]);
    lecturaAnterior.current = lectura;
  }, [lectura, connected, listoParaGuardar, feedback, sensorIp]);

  //flush seguro
  const flush = useCallback(async () => {
    if (!listoParaGuardar || !batchLecturas.length || isFlushing.current) {
      console.log(
        "useSyncPostura flush: skip -",
        { listoParaGuardar, batchSize: batchLecturas.length, isFlushing: isFlushing.current }
      );
      return;
    }
    console.log(`FLUSH: Guardando ${batchLecturas.length} lecturas en DB`);
    isFlushing.current = true;
    const copia = [...batchLecturas];
    setBatchLecturas([]);
    try {
      await insertarLecturas(copia);
      setAlertasPendientes([]);
      sensorEvents.emit("flush");
      console.log("Flush completado exitosamente");
    } catch (e) {
      console.log("error flush:", e);
    } finally {
      isFlushing.current = false;
    }
  }, [batchLecturas, insertarLecturas, listoParaGuardar]);

  //flush al tener el maximo de batch
  useEffect(() => {
    if (batchLecturas.length >= MAX_BATCH) {
      flush();
    }
  }, [batchLecturas, flush]);

  //flush al salir de la app
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        flush();
        if (sensorIp) {
          import("@/helpers/sensorApi").then(async ({ stopVibration }) => {
            console.log(`[VIBRATION] (AppState) Enviando stopVibration a ${sensorIp}`);
            const ok = await stopVibration(sensorIp);
            console.log(`[VIBRATION] (AppState) Resultado stopVibration: ${ok}`);
          });
        }
      }
    });

    return () => sub.remove();
  }, [flush, sensorIp]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  return {
    flush,
    listoParaGuardar,
  };
}
