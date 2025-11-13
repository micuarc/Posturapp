import { SQLiteDatabase } from 'expo-sqlite';

export const dbDebugger = {
  async verUsuarios(db: SQLiteDatabase) {
    try {
      const usuarios = await db.getAllAsync('SELECT * FROM usuarios');
      console.log('=== USUARIOS EN DB ===');
      console.log(JSON.stringify(usuarios, null, 2));
      return usuarios;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }
  },

  async verUsuario(db: SQLiteDatabase, id: number) {
    try {
      const usuario = await db.getFirstAsync(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
      );
      console.log('=== USUARIO ===');
      console.log(JSON.stringify(usuario, null, 2));
      return usuario;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },

  async verEstructuraTabla(db: SQLiteDatabase, nombreTabla: string) {
    try {
      const estructura = await db.getAllAsync(
        `PRAGMA table_info(${nombreTabla})`
      );
      console.log(`=== ESTRUCTURA DE ${nombreTabla} ===`);
      console.log(JSON.stringify(estructura, null, 2));
      return estructura;
    } catch (error) {
      console.error('Error obteniendo estructura:', error);
      return [];
    }
  },

  async verTodasTablas(db: SQLiteDatabase) {
    try {
      const tablas = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      console.log('=== TABLAS EN DB ===');
      console.log(JSON.stringify(tablas, null, 2));
      return tablas;
    } catch (error) {
      console.error('Error obteniendo tablas:', error);
      return [];
    }
  },

  async ejecutarQuery(db: SQLiteDatabase, query: string, params: any[] = []) {
    try {
      const resultado = await db.getAllAsync(query, params);
      console.log('=== RESULTADO QUERY ===');
      console.log('Query:', query);
      console.log('Params:', params);
      console.log('Resultado:', JSON.stringify(resultado, null, 2));
      return resultado;
    } catch (error) {
      console.error('Error ejecutando query:', error);
      return [];
    }
  },
};