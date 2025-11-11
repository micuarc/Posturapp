import { useMemo } from "react";
import { useSyncPostura } from "./useSyncPostura";
import { Lectura } from "./useWifiSensor";

export function usePostura(lectura: Lectura | null, connected: boolean) {
  // const { lectura, connected } = useSyncPostura(lectura, connected);

  const desviacion = useMemo(() => {
    if (!lectura) return 0;
    return (
      Math.abs(lectura.pitch - lectura.refPitch) +
      Math.abs(lectura.roll - lectura.refRoll)
    );
  }, [lectura]);

  const posturaCorrecta = lectura ? lectura.bad === 0 : true;

  return {
    connected,
    posturaCorrecta,
    desviacion,
    lectura,
  };
}
