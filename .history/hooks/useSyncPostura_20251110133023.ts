import { useEffect, useState } from "react";
import { useDatabaseSelector } from "./useDatabaseSelector";
import { useWifiSensor } from "./useWifiSensor";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number;          // 1 = mala postura, 0 = buena
  calibrating?: number; // 1 = calibrando, 0 = normal
}
export function useSyncPostura(ip: string) {
  const { guardar } = useDatabaseSelector();
  const { lectura, connected } = useWifiSensor(ip);
  const [failCount, setFailCount] = useState(0);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    if (!lectura) return;

    // Control de conexión
    if (!connected) {
      setFailCount(c => c + 1);
      if (failCount > 5) console.warn("ESP32 no responde");
      return;
    }

    setFailCount(0);

    const esMalaPostura = lectura.bad === 1;
    const estaCalibrando = lectura.calibrating === 1;

    setPosturaCorrecta(!esMalaPostura);
    setCalibrating(estaCalibrando);

    // Si el ESP está calibrando, no registrar datos ni vibraciones
    if (estaCalibrando) return;

    // Acumulación de métricas
    if (esMalaPostura) {
      setActivaciones(prev => prev + 1);
    }

    setMinutos(prev => prev + 1 / 60); // simular tiempo de sesión (1s ≈ 1/60 min)

    // Guardar registro en base o mock
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

  return { lectura, connected, posturaCorrecta, activaciones, minutos, calibrating };
}
