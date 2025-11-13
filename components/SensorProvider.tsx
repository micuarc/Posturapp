import "react";
import { FC, ReactNode, useEffect, useState } from "react";
import { SensorContext } from "@/helpers/SensorContext";
import { useWifiSensor } from "@/hooks/useWifiSensor";
import { useSyncPostura } from "@/hooks/useSyncPostura";
import { useSQLiteContext } from "expo-sqlite";
import { NativeModules, Platform } from "react-native";
import { useAuth } from "@/helpers/AuthContext";

const { Postura } = NativeModules;

const SensorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const { usuario } = useAuth();

  const [ip, setIp] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // cargar la IP desde SQLite (se recarga cuando cambia refreshKey)
  useEffect(() => {
    (async () => {
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM configuracion WHERE key = ?",
        ["sensor_ip"]
      );
      if (row?.value) setIp(row.value);
    })();
  }, [db, refreshKey]);

  // Polling cada 5 segundos para detectar cambios en la IP
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const { lectura, connected } = useWifiSensor(ip ?? "");
  useSyncPostura(db, lectura, connected);

  // iniciar servicio nativo con IP real
  useEffect(() => {
    if (!ip) return;
    if (Platform.OS !== "android" || !Postura) return;

    try {
      Postura.startService(ip);
      console.log("Servicio nativo iniciado con IP:", ip);
    } catch (err) {
      console.log("Error iniciando servicio:", err);
    }
  }, [ip]);

  return (
    <SensorContext.Provider value={{ lectura, connected, ip }}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorProvider;
