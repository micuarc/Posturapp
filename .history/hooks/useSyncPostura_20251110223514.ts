import { useEffect, useState } from "react";
import { useDatabaseSelector } from "./useDatabaseSelector";
import { useWifiSensor } from "./useWifiSensor";
import { useDatabase } from "./useDatabase";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number; // 1 = mala postura, 0 = buena
  calibrating?: number; // 1 = calibrando, 0 = normal
}

export function useSyncPostura(lectura: Lectura | null, connected: boolean) {
  const { guardar, ready } = useDatabase();
  // const { lectura, connected } = useWifiSensor(ip);
  const [batchLecturas, setBatchLecturas] = useState<Lectura[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    if(!lectura) return;
    setBatchLecturas((p) => [...p, lectura]);
  }, [lectura]);

  useEffect(() => {
    if (batchLecturas.length > 20) {
      const batch = batchLecturas;
      setBatchLecturas([]);
    }
  }, [batchLecturas]);

  const syncPostura = async () => {
    if (!lectura) return;

    // Control de conexión
    if (!connected) {
      setFailCount((c) => c + 1);
      if (failCount > 5) console.warn("ESP32 no responde");
      return;
    }

    setFailCount(0);
    const esMalaPostura = lectura.bad === 1;
    const estaCalibrando = lectura.calibrating === 1;

    // Si el ESP está calibrando, no registrar datos ni vibraciones
    if (estaCalibrando) return;

    guardar(
      1,
      esMalaPostura ? 1 : 0,
      lectura.pitch,
      lectura.roll,
      lectura.refPitch,
      lectura.refRoll,
      esMalaPostura ? 1 : 0
    );
  };

  return {
    lectura,
    connected,
    posturaCorrecta,
    activaciones,
    minutos,
    calibrating,
  };
}
