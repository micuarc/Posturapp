import { useDatabase } from "./useDatabase";
import { useSensorWifi } from "./useSensorWifi";
import { useEffect } from "react";

export function useRegistroPostura(espIp: string) {
  const { data, connected } = useSensorWifi(espIp);
  const { insertarRegistro } = useDatabase();

  useEffect(() => {
    const interval = setInterval(() => {
      insertarRegistro(5, data.bad ? 1 : 0);
    }, 300000); // cada 5 min
    return () => clearInterval(interval);
  }, [data]);

  return { data, connected };
}
