import { useEffect, useState } from "react";
import { useDatabase, Registro } from "./useDatabase";

interface Stats {
  promedioPitch: number;
  promedioRoll: number;
  alertasHoy: number;
  datosSemanales: { x: string; y: number; label: string }[];
}

export function usePostura() {
  const { obtener } = useDatabase();
  const [stats, setStats] = useState<Stats>({
    promedioPitch: 0,
    promedioRoll: 0,
    alertasHoy: 0,
    datosSemanales: [],
  });

  useEffect(() => {
    const procesar = async () => {
      const registros: Registro[] = await obtener();
      if (!registros.length) return;

      const hoy = new Date().toISOString().slice(0, 10);
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - 6);
      const fechaInicio = inicioSemana.toISOString().slice(0, 10);

      const recientes = registros.filter(r => r.fecha >= fechaInicio);
      const alertasHoy = recientes.filter(r => r.fecha.startsWith(hoy) && r.malaPostura).length;

      const promedioPitch = recientes.reduce((a, r) => a + r.pitch, 0) / recientes.length;
      const promedioRoll = recientes.reduce((a, r) => a + r.roll, 0) / recientes.length;

      // Agrupar alertas por día
      const agrupado: Record<string, { total: number; malas: number }> = {};
      for (const r of recientes) {
        const dia = r.fecha.slice(5, 10); // formato MM-DD
        if (!agrupado[dia]) agrupado[dia] = { total: 0, malas: 0 };
        agrupado[dia].total++;
        if (r.malaPostura) agrupado[dia].malas++;
      }

      const datosSemanales = Object.entries(agrupado).map(([x, d]) => ({
        x,
        y: Math.round((d.malas / d.total) * 100),
        label: x,
      }));

      setStats({ promedioPitch, promedioRoll, alertasHoy, datosSemanales });
    };

    procesar();
  }, []);

  return stats;
}
