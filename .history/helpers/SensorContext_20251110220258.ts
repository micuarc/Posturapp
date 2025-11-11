import { Lectura } from '@/hooks/useWifiSensor';
import { createContext } from 'react';

export const SensorContext = createContext<Lectura | null>(null);