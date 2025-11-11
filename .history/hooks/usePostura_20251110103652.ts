import { useEffect, useState } from "react";
import BluetoothSerial from "react-native-bluetooth-serial-next";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("postura.db");

export function usePostura(deviceId?: string) {
  const [connected, setConnected] = useState(false);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [activaciones, setActivaciones] = useState(0);
  const [minutosUso, setMinutosUso] = useState(0);

  // Inicializa tabla
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS registros (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT,
          minutos INTEGER,
          activaciones INTEGER
        );
      `);
    });
  }, []);

  // Conexión Bluetooth y lectura del sensor
  useEffect(() => {
    if (!deviceId) return;
    const connect = async () => {
      await BluetoothSerial.connect(deviceId);
      setConnected(true);
      BluetoothSerial.readEvery((msg) => {
        const [x, y, z] = msg.trim().split(",").map(Number);
        const postura = Math.abs(x) < 10 && Math.abs(y) < 10;
        setPosturaCorrecta(postura);
        if (!postura) setActivaciones(a => a + 1);
      });
    };
    connect();
    return () => BluetoothSerial.disconnectAll();
  }, [deviceId]);

  // Incrementa minutos de uso cada 60s
  useEffect(() => {
    const timer = setInterval(() => setMinutosUso(m => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Guarda registro cada 5 minutos
  useEffect(() => {
    const persist = setInterval(() => {
      db.transaction(tx => {
        tx.executeSql(
          "INSERT INTO registros (fecha, minutos, activaciones) VALUES (?, ?, ?)",
          [new Date().toISOString(), minutosUso, activaciones]
        );
      });
    }, 300000); // cada 5 min
    return () => clearInterval(persist);
  }, [minutosUso, activaciones]);

  const obtenerHistorial = (cb: (rows: any[]) => void) => {
    db.transaction(tx => {
      tx.executeSql("SELECT * FROM registros ORDER BY fecha DESC LIMIT 7;", [], (_, { rows }) => cb(rows._array));
    });
  };

  return { connected, posturaCorrecta, minutosUso, activaciones, obtenerHistorial };
}
