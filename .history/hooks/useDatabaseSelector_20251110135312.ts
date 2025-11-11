// hooks/useDatabaseSelector.ts
import { useDatabase } from "./useDatabase";
import { useMockDatabase } from "./useMockDatabase";

const USE_MOCK = false; // ← ponlo en false cuando actives SQLite

export function useDatabaseSelector() {
  return USE_MOCK ? useMockDatabase() : useDatabase();
}
