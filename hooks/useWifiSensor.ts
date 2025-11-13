import { useEffect, useRef, useState } from "react";

export interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  malaPostura: number;
  calibrating?: number;
  timestamp: string;
}

export function useWifiSensor(ip: string) {
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [connected, setConnected] = useState(false);
  const isFetching = useRef(false);
  

  useEffect(() => {
    if (!ip) return;
    const interval = setInterval(async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const res = await fetch(`http://${ip}/data`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("No response");
        const data = await res.json();
        setLectura({
          pitch: data.pitch,
          roll: data.roll,
          refPitch: data.refPitch,
          refRoll: data.refRoll,
          malaPostura: data.malaPostura,
          calibrating: data.calibrating,
          timestamp: new Date().toISOString(),
        });
        setConnected(true);
      } catch {
        setConnected(false);
      } finally {
        clearTimeout(timeout);
        isFetching.current = false;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [ip]);

  return { lectura, connected };
}
