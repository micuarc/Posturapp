import { useEffect, useMemo, useState } from "react";
import { Lectura } from "./useWifiSensor";

export function usePostura(lectura: Lectura | null, connected: boolean) {
  const [failCount, setFailCount] = useState(0);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [calibrating, setCalibrating] = useState(false);

  const evaluarPostura = async () => {
    if (!lectura) return;

    // conexion con microcontrolador
    if (!connected) {
      setFailCount((c) => c + 1);
      if (failCount > 5) console.warn("ESP32 no responde");
      return;
    }

    setFailCount(0);

    const estaCalibrando = lectura.calibrating === 1;
    setCalibrating(estaCalibrando);
    // si el ESP está calibrando, no registrar datos ni vibraciones
    if (estaCalibrando) return;
    
    const esMalaPostura = lectura.bad === 1;
    setPosturaCorrecta(!esMalaPostura);

    // Acumulación de métricas
    if (esMalaPostura) {
      setActivaciones((prev) => prev + 1);
    }

    setMinutos((prev) => prev + 1 / 60); 
  };

  useEffect(() => {
    evaluarPostura();
  }, [lectura]);

  const desviacion = useMemo(() => {
    if (!lectura) return 0;
    return (
      Math.abs(lectura.pitch - lectura.refPitch) +
      Math.abs(lectura.roll - lectura.refRoll)
    );
  }, [lectura]);

  return {
    connected,
    activaciones,
    minutos,
    posturaCorrecta,
    desviacion,
    lectura,
  };
}
