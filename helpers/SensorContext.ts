import { Lectura } from '@/hooks/useWifiSensor';
import { createContext } from 'react';

export interface ISensorContext {
  lectura: Lectura | null
  connected: boolean
  ip: string | null
}

export const SensorContext = createContext<ISensorContext>({
  lectura: null,
  connected: false,
  ip: null
});