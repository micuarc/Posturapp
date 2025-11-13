package com.anonymous.posturapp

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

object SQLiteHelper {

    private class DB(context: Context) :
        SQLiteOpenHelper(context, "postura.db", null, 1) {

        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS registros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT,
                    pitch REAL,
                    roll REAL,
                    refPitch REAL,
                    refRoll REAL,
                    malaPostura INTEGER
                );
                """
            )
        }

        override fun onUpgrade(db: SQLiteDatabase, old: Int, newV: Int) {}
    }

    fun insertLectura(
        context: Context,
        pitch: Double,
        roll: Double,
        refPitch: Double,
        refRoll: Double,
        mala: Int
    ) {
        try {
            val db = DB(context).writableDatabase
            db.execSQL(
                """
                INSERT INTO registros (fecha, pitch, roll, refPitch, refRoll, malaPostura)
                VALUES (?, ?, ?, ?, ?, ?);
                """.trimIndent(),
                arrayOf(
                    System.currentTimeMillis().toString(),
                    pitch, roll, refPitch, refRoll, mala
                )
            )
            db.close()
        } catch (e: Exception) {
            Log.e("SQLiteHelper", "Error insert", e)
        }
    }
}
