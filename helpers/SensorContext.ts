import { Lectura } from '@/hooks/useWifiSensor';
import { createContext } from 'react';

export interface ISensorContext {
    lectura: Lectura | null,
    connected: boolean,
}

export const SensorContext = createContext<ISensorContext>({
    lectura: null,
    connected: false,
});