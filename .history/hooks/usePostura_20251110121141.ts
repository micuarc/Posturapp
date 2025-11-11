import { useEffect, useState } from "react";
import { useWifiSensor } from "./useWifiSensor";

export function usePostura(espIp: string) {
  const { connected, lectura } = useWifiSensor(espIp);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);

  // Umbrales empíricos: ajusta según tus pruebas
  const ROLL_LIMITE = 10;   // grados
  const PITCH_LIMITE = 12;  // grados

  useEffect(() => {
    if (!lectura) return;
    const { roll, pitch } = lectura;
    const correcta = Math.abs(roll) < ROLL_LIMITE && Math.abs(pitch) < PITCH_LIMITE;

    if (!correcta) setActivaciones(a => a + 1);
    setPosturaCorrecta(correcta);
  }, [lectura]);

  useEffect(() => {
    const timer = setInterval(() => setMinutos(m => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return { connected, posturaCorrecta, activaciones, minutos };
}
