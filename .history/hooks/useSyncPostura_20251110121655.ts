import { useEffect } from "react";
import { usePostura } from "./usePostura";
import { useDatabase } from "./useDatabase";

export function useSyncPostura(espIp: string) {
  const { connected, lectura, posturaCorrecta, activaciones, minutos } = usePostura(espIp);
  const { guardar } = useDatabase();

  useEffect(() => {
    if (!lectura) return;

    const interval = setInterval(() => {
      guardar(
        minutos,
        activaciones,
        lectura.pitch,
        lectura.roll,
        lectura.refPitch,
        lectura.refRoll
      );
    }, 5 * 60 * 1000); // cada 5 minutos

    return () => clearInterval(interval);
  }, [lectura, minutos, activaciones]);

  return { connected, lectura, posturaCorrecta, activaciones, minutos };
}
