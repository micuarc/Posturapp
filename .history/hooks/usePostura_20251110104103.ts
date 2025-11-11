import { useEffect, useState } from "react";
import BluetoothSerial from "react-native-bluetooth-serial-next";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

async function initDB() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("postura.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      minutos INTEGER,
      activaciones INTEGER
    );
  `);
  return db;
}

export function usePostura(deviceId?: string) {
  const [connected, setConnected] = useState(false);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [activaciones, setActivaciones] = useState(0);
  const [minutosUso, setMinutosUso] = useState(0);

  // Conexión Bluetooth y lectura del sensor
  useEffect(() => {
    if (!deviceId) return;

    const connect = async () => {
      try {
        await BluetoothSerial.connect(deviceId);
        setConnected(true);

        await BluetoothSerial.withDelimiter("\n");
        BluetoothSerial.on("read", (data) => {
          const msg = data.data?.trim();
          if (!msg) return;
          const [x, y, z] = msg.split(",").map(Number);
          const postura = Math.abs(x) < 10 && Math.abs(y) < 10;
          setPosturaCorrecta(postura);
          if (!postura) setActivaciones((a) => a + 1);
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

  // Incrementa minutos de uso cada minuto
  useEffect(() => {
    const timer = setInterval(() => setMinutosUso((m) => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Guarda registro cada 5 minutos
  useEffect(() => {
    const persist = setInterval(async () => {
      try {
        const database = await initDB();
        await database.runAsync(
          "INSERT INTO registros (fecha, minutos, activaciones) VALUES (?, ?, ?)",
          [new Date().toISOString(), minutosUso, activaciones]
        );
      } catch (err) {
        console.warn("Error al guardar registro:", err);
      }
    }, 300000);
    return () => clearInterval(persist);
  }, [minutosUso, activaciones]);

  const obtenerHistorial = async () => {
    const database = await initDB();
    const result = await database.getAllAsync(
      "SELECT * FROM registros ORDER BY fecha DESC LIMIT 7"
    );
    return result; // array de objetos
  };

  return { connected, posturaCorrecta, minutosUso, activaciones, obtenerHistorial };
}
