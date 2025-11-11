import { useEffect, useState } from "react";

export interface SensorData {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: boolean;
}

export function useWifiSensor(espIp: string) {
  const [connected, setConnected] = useState(false);
  const [lectura, setLectura] = useState<SensorData | null>(null);

  useEffect(() => {
    if (!espIp) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://${espIp}/data`);
        if (!res.ok) throw new Error("Sin respuesta del ESP32");

        const json = await res.json();
        setLectura({
          pitch: json.pitch,
          roll: json.roll,
          refPitch: json.refPitch,
          refRoll: json.refRoll,
          bad: json.bad === 1,
        });

        setConnected(true);
      } catch {
        setConnected(false);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [espIp]);

  return { connected, lectura };
}
