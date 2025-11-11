import { useEffect, useState } from "react";

interface Lectura {
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  bad: number;
}

let isFetching = false;

export function useWifiSensor(ip: string) {
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!ip) return;
    const interval = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const res = await fetch(`http://${ip}/data`, { timeout: 3000 });
        if (!res.ok) throw new Error("No response");
        const data = await res.json();
        setLectura(data);
        setConnected(true);
      } catch {
        setConnected(false);
      } finally {
        isFetching = false;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [ip]);

  return { lectura, connected };
}
