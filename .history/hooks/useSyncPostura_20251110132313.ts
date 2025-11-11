import { useEffect, useState } from "react";
//import { useDatabase } from "./useDatabase";
import { useDatabaseSelector } from "./useDatabaseSelector";
import { useWifiSensor } from "./useWifiSensor";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number; // 1 = mala postura, 0 = buena
}

export function useSyncPostura(ip: string) {
  //const { guardar } = useDatabase();
  const { guardar } = useDatabaseSelector();

  const { lectura, connected } = useWifiSensor(ip);

  const [failCount, setFailCount] = useState(0);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);

  // cada ciclo registra una lectura si está disponible
  useEffect(() => {
    if (!lectura) return;

    if (!connected) {
      setFailCount((c) => c + 1);
      if (failCount > 5) console.warn("ESP32 no responde");
      return;
    }

    setFailCount(0);

    const esMalaPostura = lectura.bad === 1;
    setPosturaCorrecta(!esMalaPostura);

    if (esMalaPostura) {
      setActivaciones((prev) => prev + 1);
    }

    setMinutos((prev) => prev + 1 / 60); // simular acumulación (1 ciclo = 1s)

    guardar(
      1,
      esMalaPostura ? 1 : 0,
      lectura.pitch,
      lectura.roll,
      lectura.refPitch,
      lectura.refRoll,
      esMalaPostura ? 1 : 0
    );
  }, [lectura]);

  return { lectura, connected, posturaCorrecta, activaciones, minutos };
}
