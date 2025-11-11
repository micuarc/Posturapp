import { useEffect, useState } from "react";
import BluetoothSerial from "react-native-bluetooth-serial-next";

export function useSensor(deviceId?: string) {
  const [data, setData] = useState({ angleX: 0, angleY: 0, angleZ: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const connect = async () => {
      await BluetoothSerial.connect(deviceId);
      setConnected(true);
      BluetoothSerial.readEvery((msg) => {
        const [x, y, z] = msg.trim().split(",").map(Number);
        setData({ angleX: x, angleY: y, angleZ: z });
      });
    };

    connect();
    return () => BluetoothSerial.disconnectAll();
  }, [deviceId]);

  return { data, connected };
}
