import * as SQLite from "expo-sqlite";

const iniciarConexion = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.runAsync(
        `CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            minutos INTEGER,
            activaciones INTEGER,
            pitch REAL,
            roll REAL,
            refPitch REAL,
            refRoll REAL,
            malaPostura INTEGER
            );`
        );
    } catch (e) {
        console.error("Error inicializando DB:", e);
    }
};

export { iniciarConexion };