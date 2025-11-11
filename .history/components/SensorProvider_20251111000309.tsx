import 'react';
import { SensorContext } from '@/helpers/SensorContext';
import { useWifiSensor } from '@/hooks/useWifiSensor';
import { FC, ReactNode } from 'react';
import { useSyncPostura } from '@/hooks/useSyncPostura';
import { useSQLiteContext } from 'expo-sqlite';

const ESP_IP = "192.168.1.16";

const SensorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { lectura, connected } = useWifiSensor(ESP_IP);
  const db = useSQLiteContext();
  const _ = useSyncPostura(db, lectura, connected);

  return (
    <SensorContext.Provider value={{lectura, connected}}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorProvider;