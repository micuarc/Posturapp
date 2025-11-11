import { useEffect, useMemo, useState } from "react";
import { Registro, useDatabase } from "./useDatabase";
import { useDatabaseSelector } from "./useDatabaseSelector";


export interface PosturaStats {
  totalActivaciones: number;
  promedioPitch: number;
  promedioRoll: number;
  desviacionPromedio: number;
  streak: number;
  postureData: { x: string; y: number }[];
  alertsData: { label: string; value: number; color: string }[];
  comparisonData: { label: string; value: number; color: string }[];
}

export function usePosturaEstadisticas() {
  const { obtener } = useDatabase();
  // const { obtener } = useDatabaseSelector();
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await obtener();
        if (mounted) {
          setRegistros(data);
        }
      } catch (err) {
        console.error("Error cargando registros:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo<PosturaStats>(() => {
    if (registros.length === 0) {
      return {
        totalActivaciones: 0,
        promedioPitch: 0,
        promedioRoll: 0,
        desviacionPromedio: 0,
        streak: 0,
        postureData: [],
        alertsData: [],
        comparisonData: [],
      };
    }

    const pastel = [
      "#A8DADC", "#F7CAD0", "#FFD6A5", "#CDB4DB",
      "#B5E48C", "#FFB5A7", "#BDE0FE",
    ];

    const totalActivaciones = registros.reduce((sum, r) => sum + r.activaciones, 0);

    const promedioPitch =
      registros.reduce((s, r) => s + Math.abs(r.pitch - r.refPitch), 0) /
      registros.length;

    const promedioRoll =
      registros.reduce((s, r) => s + Math.abs(r.roll - r.refRoll), 0) /
      registros.length;

    const desviacionPromedio = promedioPitch + promedioRoll;
    const streak = Math.min(7, registros.length);

    const postureData = registros.map((r, i) => ({
      x: `#${i + 1}`,
      y: Math.abs(r.pitch - r.refPitch) + Math.abs(r.roll - r.refRoll),
    }));

    const alertsData = registros.map((r, i) => ({
      label: `#${i + 1}`,
      value: r.activaciones,
      color: pastel[i % pastel.length],
    }));

    const weeks: { label: string; value: number }[] = [];
    for (let i = 0; i < registros.length; i += 7) {
      const chunk = registros.slice(i, i + 7);
      const avg =
        chunk.reduce((s, r) => s + r.activaciones, 0) / (chunk.length || 1);
      weeks.push({ label: `Sem ${weeks.length + 1}`, value: avg });
    }

    const comparisonData = weeks.map((w, i) => ({
      label: w.label,
      value: w.value,
      color: pastel[i % pastel.length],
    }));

    return {
      totalActivaciones,
      promedioPitch,
      promedioRoll,
      desviacionPromedio,
      streak,
      postureData,
      alertsData,
      comparisonData,
    };
  }, [registros]);

  return stats;
}
