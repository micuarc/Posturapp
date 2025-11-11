import { useEffect, useState } from "react";

export function useWifiSensor(espIp: string) {
  const [connected, setConnected] = useState(false);
  const [lectura, setLectura] = useState<{x:number,y:number,z:number}|null>(null);

  useEffect(() => {
    if (!espIp) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://${espIp}/data`, { timeout: 2000 });
        if (!res.ok) throw new Error("No response");
        const json = await res.json();
        setLectura(json);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };

    // Lectura periódica
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [espIp]);

  return { connected, lectura };
}
