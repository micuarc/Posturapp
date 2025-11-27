import { useEffect, useState } from "react";
import { NativeModules, DeviceEventEmitter, Platform } from "react-native";

const { SensorService } = NativeModules;

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

  useEffect(() => {
    if (!ip) {
      console.log("useWifiSensor: NO IP, no inicia.");
      return;
    }

    if (Platform.OS !== "android" || !SensorService) {
      console.warn("SensorService only available on Android");
      return;
    }

    console.log("useWifiSensor: Starting native service with IP:", ip);

    SensorService.startService(ip)
      .then((result: string) => {
        console.log("Native service started:", result);
      })
      .catch((error: any) => {
        console.error("Failed to start native service:", error);
        setConnected(false);
      });

    const interval = setInterval(async () => {
      try {
        const dataStr = await SensorService.getLatestData();
        if (dataStr) {
          const data = JSON.parse(dataStr);
          
          const dataTimestamp = data._timestamp || 0;
          const now = Date.now();
          const age = now - dataTimestamp;
          
          if (age > 5000) {
            console.log(`datos antiguos, marcando desconectado`);
            setConnected(false);
            return;
          }
                    
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
        } else {
          console.log("no hay datos en SharedPreferences");
          setConnected(false);
        }
      } catch (error) {
        console.error(error);
        setConnected(false);
      }
    }, 500);

    return () => {
      console.log("useWifiSensor: Cleanup, stopping native service");
      clearInterval(interval);
      SensorService.stopService()
        .then((result: string) => console.log("Native service stopped:", result))
        .catch((error: any) => console.error("Error stopping service:", error));
    };
  }, [ip]);

  return { lectura, connected };
}
