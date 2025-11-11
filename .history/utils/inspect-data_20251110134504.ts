import * as SQLite from "expo-sqlite";

async function logDatabase() {
  const db = await SQLite.openDatabaseAsync("postura.db");

  const rows = await db.getAllAsync("SELECT * FROM registros;");
  console.log("Datos actuales en la DB:", rows);
}
