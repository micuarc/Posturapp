import { useDatabase } from "./useDatabase";
import { usePosturaWiFi } from "./usePosturaWiFi";
import { useEffect } from "react";

export function useRegistroPostura(espIp: string) {
  const { data, connected } = usePosturaWiFi(espIp);
  const { insertarRegistro } = useDatabase();

  useEffect(() => {
    const interval = setInterval(() => {
      insertarRegistro(5, data.bad ? 1 : 0);
    }, 300000); // cada 5 min
    return () => clearInterval(interval);
  }, [data]);

  return { data, connected };
}
