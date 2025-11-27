import { createContext } from "react";
import { Lectura } from "@/hooks/useWifiSensor";

export interface ISensorContext {
  lectura: Lectura | null;
  connected: boolean;
  ip: string | null;
  setIp: (val: string | null) => void;
}

export const SensorContext = createContext<ISensorContext>({
  lectura: null,
  connected: false,
  ip: null,
  setIp: () => {},
});
