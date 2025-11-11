import { useEffect, useState } from "react";
import BluetoothSerial from "react-native-bluetooth-serial-next";

export function useSensor(deviceId?: string) {
  const [data, setData] = useState({ angleX: 0, angleY: 0, angleZ: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const connect = async () => {
      try {
        await BluetoothSerial.connect(deviceId);
        setConnected(true);

        // Configura el delimitador (asume que cada lectura termina en "\n")
        await BluetoothSerial.withDelimiter("\n");

        // Escucha las lecturas del sensor
        BluetoothSerial.on("read", (event) => {
          const msg = event.data?.trim();
          if (!msg) return;
          const [x, y, z] = msg.split(",").map(Number);
          setData({ angleX: x, angleY: y, angleZ: z });
        });
      } catch (err) {
        console.warn("Error al conectar:", err);
      }
    };

    connect();

    return () => {
      BluetoothSerial.removeAllListeners();
      BluetoothSerial.disconnectAll();
    };
  }, [deviceId]);

  return { data, connected };
}
