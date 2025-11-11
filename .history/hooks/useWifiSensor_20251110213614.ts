import { useEffect, useState } from "react";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number;
  calibrating?: number;
}


let isFetching = false;

export function useWifiSensor(ip: string) {
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!ip) return;
    const interval = setInterval(async () => {
      console.log('fetch')
      if (isFetching) return;
      isFetching = true;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const res = await fetch(`http://${ip}/data`, { signal: controller.signal });
        if (!res.ok) throw new Error("No response");
        const data = await res.json();
        setLectura(data);
        setConnected(true);
      } catch {
        setConnected(false);
      } finally {
        clearTimeout(timeout);
        isFetching = false;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [ip]);

  return { lectura, connected };
}
