import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

async function exportarDB() {
  const dbUri = `${FileSystem.documentDirectory}SQLite/postura.db`;
  const exists = await FileSystem.getInfoAsync(dbUri);
  if (exists.exists) {
    await Sharing.shareAsync(dbUri);
  } else {
    console.warn("No se encontró la base de datos");
  }
}
