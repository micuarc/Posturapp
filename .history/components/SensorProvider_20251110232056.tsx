import 'react';
import { SensorContext } from '@/helpers/SensorContext';
import { useWifiSensor } from '@/hooks/useWifiSensor';
import { FC, ReactNode } from 'react';
import { useSyncPostura } from '@/hooks/useSyncPostura';

const ESP_IP = "192.168.1.16";

const SensorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { lectura, connected } = useWifiSensor(ESP_IP);
  const _ = useSyncPostura(lectura, connected);

  return (
    <SensorContext.Provider value={{lectura, connected}}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorProvider;