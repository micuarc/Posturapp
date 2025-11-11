import { useEffect, useState } from "react";
import { useWifiSensor } from "./useWifiSensor";

export function usePostura(espIp: string) {
  const { connected, lectura } = useWifiSensor(espIp);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    if (!lectura) return;
    if (lectura.bad) setActivaciones((a) => a + 1);
    setPosturaCorrecta(!lectura.bad);
  }, [lectura]);

  useEffect(() => {
    const timer = setInterval(() => setMinutos((m) => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return { connected, lectura, posturaCorrecta, activaciones, minutos };
}
