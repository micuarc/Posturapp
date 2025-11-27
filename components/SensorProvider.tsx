import "react";
import { FC, ReactNode, useEffect, useState } from "react";
import { SensorContext } from "@/helpers/SensorContext";
import { useWifiSensor } from "@/hooks/useWifiSensor";
import { useSyncPostura } from "@/hooks/useSyncPostura";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/helpers/AuthContext";
import {
  setEsp32Ip,
  startService as startNativeService,
} from "@/helpers/postura";

const SensorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const { usuario } = useAuth();

  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM configuracion WHERE key = ?",
          ["sensor_ip"]
        );
        setIp(row?.value?.trim() ?? null);
      } catch {
        setIp(null);
      }
    })();
  }, [db]);

  const { lectura, connected } = useWifiSensor(ip ?? "");

  useSyncPostura(db, lectura, connected, ip);

  useEffect(() => {
    if (!ip) return;

    console.log("Postura: actualizando IP en SharedPreferences:", ip);
    setEsp32Ip(ip);

    console.log("Postura: iniciando servicio nativo…");
    startNativeService();
  }, [ip]);

  return (
    <SensorContext.Provider
      value={{
        lectura,
        connected,
        ip,
        setIp,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export default SensorProvider;
