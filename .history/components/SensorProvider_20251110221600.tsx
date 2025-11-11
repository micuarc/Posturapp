import 'react';
import { SensorContext } from '@/helpers/SensorContext';
import { useWifiSensor } from '@/hooks/useWifiSensor';
import { FC, ReactNode } from 'react';

const ESP_IP = "192.168.1.16";

const SensorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const _ = useWifiSensor(ESP_IP);

  return (
    <SensorContext.Provider value={}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorProvider;