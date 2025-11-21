import { useEffect, useMemo, useState } from "react";
import { Registro, useDatabase } from "./useDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { generarBuckets, asignarABuckets } from "@/helpers/GenerarBuckets";
import { sensorEvents } from "@/helpers/events";

type Alerta = { hora: string; inicio: string; duracionSegundos: number | null };

export interface PosturaStats {
  totalActivaciones: number;
  desviacionPromedio: number;
  promedioPitch: number;
  promedioRoll: number;
  streak: number;

  totalDia: number;
  porcentajeMalaDia: number;
  porcentajeBuenaDia: number;
  ultimasAlertasDia: Alerta[];

  registrosDia: { x: string; y: number }[];
  alertasDia: { x: string; y: number }[];

  areaSemanal: { x: string; y: number }[];
  barrasMensuales: { label: string; value: number; color: string }[];
}

export function usePosturaEstadisticas(refreshKey: number = 0): PosturaStats {
  const db = useSQLiteContext();
  const { obtener } = useDatabase(db);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [alertasReactivas, setAlertasReactivas] = useState<Alerta[]>([]);

  useEffect(() => {
    obtener().then(setRegistros);
  }, [obtener, refreshKey]);

  useEffect(() => {
    const alertaSub = sensorEvents.addListener("alerta", (alerta: Alerta) => {
      setAlertasReactivas((prev) => {
        const sinDup = prev.filter((a) => a.inicio !== alerta.inicio);
        return [...sinDup, alerta].slice(-10);
      });
    });
    const flushSub = sensorEvents.addListener("flush", () => setAlertasReactivas([]));
    return () => {
      alertaSub.remove();
      flushSub.remove();
    };
  }, []);

  return useMemo(() => {
    if (!registros.length) {
      return {
        totalActivaciones: 0,
        desviacionPromedio: 0,
        promedioPitch: 0,
        promedioRoll: 0,
        streak: 0,
        totalDia: 0,
        porcentajeMalaDia: 0,
        porcentajeBuenaDia: 100,
        ultimasAlertasDia: [],
        registrosDia: [],
        alertasDia: [],
        areaSemanal: [],
        barrasMensuales: []
      };
    }

    const ahora = new Date();
    const yyyyMMdd = (d: Date) => d.toISOString().slice(0, 10);
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const hace7 = new Date(hoy);
    hace7.setDate(hoy.getDate() - 6);
    const hace28 = new Date(hoy);
    hace28.setDate(hoy.getDate() - 28);

    const regDia = registros
      .filter(r => yyyyMMdd(new Date(r.fecha)) === yyyyMMdd(hoy))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const regUlt7 = registros.filter(r => new Date(r.fecha) >= hace7);
    const regUlt28 = registros.filter(r => new Date(r.fecha) >= hace28);

    const totalDia = regDia.filter(r => r.malaPostura === 1).length;
    const totalActivaciones = totalDia;
    const promedioPitch = registros.reduce((s, r) => s + Math.abs(r.pitch - r.refPitch), 0) / registros.length;
    const promedioRoll = registros.reduce((s, r) => s + Math.abs(r.roll - r.refRoll), 0) / registros.length;
    const desviacionPromedio = promedioPitch + promedioRoll;

    const porDia = new Map<string, { total: number; malas: number }>();
    registros.forEach(r => {
      const f = r.fecha.slice(0, 10);
      const it = porDia.get(f) ?? { total: 0, malas: 0 };
      it.total++;
      if (r.malaPostura === 1) it.malas++;
      porDia.set(f, it);
    });

    const diasOrd = Array.from(porDia.entries()).sort(([a], [b]) => a.localeCompare(b));
    let streak = 0;
    for (let i = diasOrd.length - 1; i >= 0; i--) {
      const { total, malas } = diasOrd[i][1];
      if (total === 0) continue;
      if (malas / total <= 0.3) streak++;
      else break;
    }

    const porcentajeMalaDia = regDia.length === 0 ? 0 : (totalDia / regDia.length) * 100;
    const porcentajeBuenaDia = 100 - porcentajeMalaDia;

    const alertasDesdeDb = (() => {
      const alertas: Alerta[] = [];
      for (let i = 1; i < regDia.length; i++) {
        const prev = regDia[i - 1];
        const curr = regDia[i];
        if (prev.malaPostura === 0 && curr.malaPostura === 1) {
          const inicio = new Date(curr.fecha);
          let finFecha: Date | null = null;
          for (let j = i + 1; j < regDia.length; j++) {
            if (regDia[j].malaPostura === 0) {
              finFecha = new Date(regDia[j].fecha);
              break;
            }
          }
          alertas.push({
            hora: inicio.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "America/Santiago",
            }),
            inicio: curr.fecha,
            duracionSegundos: finFecha
              ? Math.max(1, Math.round((finFecha.getTime() - inicio.getTime()) / 1000))
              : null,
          });
        }
      }
      return alertas;
    })();

    const ultimasAlertasDia = [...alertasDesdeDb, ...alertasReactivas]
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .slice(-10)
      .reverse();

    const registrosDia = (() => {
      if (regDia.length < 2) return [];
      const inicio = new Date(regDia[0].fecha);
      const fin = new Date(regDia[regDia.length - 1].fecha);
      const buckets = generarBuckets(inicio, fin, 10);
      return asignarABuckets(regDia, buckets, () => 1);
    })();

    const alertasDia = (() => {
      if (regDia.length < 2) return [];
      const inicio = new Date(regDia[0].fecha);
      const fin = new Date(regDia[regDia.length - 1].fecha);
      const buckets = generarBuckets(inicio, fin, 10);
      return asignarABuckets(regDia, buckets, r => (r.malaPostura ? 1 : 0));
    })();

    const areaSemanal = (() => {
      const pastel = ["#A8DADC", "#F7CAD0", "#FFD6A5", "#CDB4DB", "#B5E48C", "#FFB5A7", "#BDE0FE"];
      const dias: { x: string; y: number; color: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        const clave = yyyyMMdd(d);
        const total = registros.filter(
          r => r.malaPostura === 1 && r.fecha.slice(0, 10) === clave
        ).length;
        dias.push({
          x: d.toLocaleDateString("es-CL", { weekday: "short" }).toUpperCase(),
          y: total,
          color: pastel[(6 - i) % pastel.length]
        });
      }
      return dias;
    })();

    const barrasMensuales = (() => {
      const pastel = ["#A8DADC", "#F7CAD0", "#FFD6A5", "#CDB4DB", "#B5E48C", "#FFB5A7", "#BDE0FE"];
      const semanas = [0, 0, 0, 0];
      const lunesSemanas: Date[] = [];

      const lunesActual = (() => {
        const x = new Date(hoy);
        const dia = x.getDay();
        const diff = dia === 0 ? -6 : 1 - dia;
        x.setDate(x.getDate() + diff);
        return x;
      })();

      lunesSemanas[0] = lunesActual;
      for (let i = 1; i < 4; i++) {
        const prev = new Date(lunesSemanas[i - 1]);
        prev.setDate(prev.getDate() - 7);
        lunesSemanas[i] = prev;
      }

      regUlt28.forEach(r => {
        const d = new Date(r.fecha);
        const diff = Math.floor((hoy.getTime() - d.getTime()) / 86400000);
        const idx = Math.floor(diff / 7);
        if (idx < 4 && r.malaPostura === 1) semanas[idx]++;
      });

      const format = (d: Date) => d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });

      return [
        { label: format(lunesSemanas[3]), value: semanas[3], color: pastel[3] },
        { label: format(lunesSemanas[2]), value: semanas[2], color: pastel[2] },
        { label: format(lunesSemanas[1]), value: semanas[1], color: pastel[1] },
        { label: format(lunesSemanas[0]), value: semanas[0], color: pastel[0] }
      ];
    })();

    return {
      totalActivaciones,
      desviacionPromedio,
      promedioPitch,
      promedioRoll,
      streak,
      totalDia,
      porcentajeMalaDia,
      porcentajeBuenaDia,
      ultimasAlertasDia,
      registrosDia,
      alertasDia,
      areaSemanal,
      barrasMensuales
    };
  }, [registros, alertasReactivas]);
}