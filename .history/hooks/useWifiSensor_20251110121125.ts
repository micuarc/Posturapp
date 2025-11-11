import { useEffect, useState } from "react";

export interface SensorData {
  roll: number;
  pitch: number;
}

export function useWifiSensor(espIp: string) {
  const [connected, setConnected] = useState(false);
  const [lectura, setLectura] = useState<SensorData | null>(null);

  useEffect(() => {
    if (!espIp) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://${espIp}/data`, { method: "GET" });
        if (!res.ok) throw new Error("Sin respuesta del sensor");
        const json = await res.json();
        setLectura(json); // { roll, pitch }
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };

    const interval = setInterval(fetchData, 1000); // cada segundo
    return () => clearInterval(interval);
  }, [espIp]);

  return { connected, lectura };
}
