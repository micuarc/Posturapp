// hooks/useMockDatabase.ts
import mockData from "@/data/mockRegistros.json";

export function useMockDatabase() {
  const obtener = () => mockData;
  const guardar = () => {}; // no hace nada
  return { obtener, guardar, ready: true };
}
