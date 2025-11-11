import mockData from "@/assets/images/data/mock/mockRegistros.json";

export function useMockDatabase() {
  const obtener = async () => mockData;
  const guardar = () => {};
  const ready = true;
  return { obtener, guardar, ready };
}
