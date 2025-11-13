import * as SQLite from "expo-sqlite";

export const iniciarConexion = async (db: SQLite.SQLiteDatabase) => {
  try {
    // para FK
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // usuarios
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        nombre TEXT,
        apellido TEXT,
        fechaNacimiento TEXT,
        genero TEXT,
        alturaCm TEXT,
        pesoKg TEXT,
        porcMusculo TEXT,
        porcGrasa TEXT,
        userIcon TEXT
      );
    `);

    // registro pertenece a un solo uusario
    // fecha es con iso completo
    await db.runAsync(`
  CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,           
    pitch REAL NOT NULL,
    roll REAL NOT NULL,
    refPitch REAL NOT NULL,
    refRoll REAL NOT NULL,
    malaPostura INTEGER DEFAULT 1,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES usuarios(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  );
`);


    // configuración
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT
      );
    `);
  } catch (e) {
    console.error("error inicializando tablas:", e);
  }
};
