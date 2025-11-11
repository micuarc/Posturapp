import { useDatabase } from "./useDatabase";
import { useMockDatabase } from "./useMockDatabase";

const USE_MOCK = false; // ← desactívalo para usar SQLite real

export function useDatabaseSelector() {
  return USE_MOCK ? useMockDatabase() : useDatabase();
}
