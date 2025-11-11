import { useEffect, useState } from "react";

export function useSensorWifi(espIp: string) {
  const [data, setData] = useState({ pitch: 0, roll: 0, bad: false });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!espIp) return;

    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const response = await fetch(`http://${espIp}/data`);
        if (response.ok) {
          const json = await response.json();
          setData({
            pitch: json.pitch,
            roll: json.roll,
            bad: !!json.bad,
          });
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    };

    // Leer datos cada 2 segundos
    interval = setInterval(fetchData, 2000);
    fetchData();

    return () => clearInterval(interval);
  }, [espIp]);

  return { data, connected };
}
