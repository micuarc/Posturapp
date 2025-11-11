import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const registros = sqliteTable("registros", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fecha: text("fecha").notNull(),
  minutos: integer("minutos").notNull(),
  activaciones: integer("activaciones").notNull(),
  pitch: real("pitch").notNull(),
  roll: real("roll").notNull(),
  refPitch: real("refPitch").notNull(),
  refRoll: real("refRoll").notNull(),
  malaPostura: integer("malaPostura").notNull(),
});
