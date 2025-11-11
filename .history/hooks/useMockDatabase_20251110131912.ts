import mockData from "@/assets/images/data/mock/mockRegistros.json";

export interface Registro {
  id: number;
  fecha: string;
  minutos: number;
  activaciones: number;
  pitch: number;
  roll: number;
  refPitch: number;
  refRoll: number;
  malaPostura: number;
}

export function useMockDatabase() {
  const obtener = (): Registro[] => mockData;
  const guardar = () => {}; // sin operación
  return { obtener, guardar, ready: true };
}
