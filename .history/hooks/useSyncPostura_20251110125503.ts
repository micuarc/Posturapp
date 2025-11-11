import { useEffect, useState } from "react";
import { useDatabase } from "./useDatabase";

export function useSyncPostura(espIP: string) {
  const { guardar } = useDatabase();
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const sync = async () => {
      try {
        const response = await fetch(`http://${espIP}/data`);
        if (!response.ok) throw new Error("No se pudo conectar al ESP32");

        const data = await response.json();
        setConectado(true);

        // Simular minutos activos y cantidad de activaciones (puedes adaptar esto)
        const minutos = 1;
        const activaciones = data.bad ? 1 : 0;

        guardar(
          minutos,
          activaciones,
          data.pitch,
          data.roll,
          data.refPitch,
          data.refRoll,
          data.bad ? 1 : 0
        );
      } catch {
        setConectado(false);
      }
    };

    const intervalId: ReturnType<typeof setInterval> = setInterval(sync, 5000);
  return () => clearInterval(intervalId);

  }, [espIP]);

  return { conectado };
}
