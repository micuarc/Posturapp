import { useEffect, useState } from "react";
import { useDatabase } from "./useDatabase";
import { useWifiSensor } from "./useWifiSensor";

export function useSyncPostura(ip: string) {
  const { guardar } = useDatabase();
  const { lectura, connected } = useWifiSensor(ip);
  const [failCount, setFailCount] = useState(0);

useEffect(() => {
  if (!lectura) return;

  if (!connected) {
    setFailCount(c => c + 1);
    if (failCount > 5) console.warn("ESP32 no responde");
    return;
  }

  setFailCount(0);
  const activaciones = lectura.bad ? 1 : 0;

  guardar(
    1,
    activaciones,
    lectura.pitch,
    lectura.roll,
    lectura.refPitch,
    lectura.refRoll,
    lectura.bad
  );
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [lectura]);

  return { lectura, connected };
}
