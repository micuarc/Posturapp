import { useEffect, useMemo, useState } from "react";
import { Registro, useDatabase } from "./useDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { generarBuckets, asignarABuckets } from "@/helpers/GenerarBuckets";
// importar datos mocks
import { registrosMock } from "@/helpers/mockRegistros";


export interface PosturaStats {
  totalActivaciones: number;
  desviacionPromedio: number;
  promedioPitch: number;
  promedioRoll: number;
  streak: number;

  // día
  totalDia: number;
  porcentajeMalaDia: number;
  porcentajeBuenaDia: number;
  ultimasAlertasDia: { hora: string; duracionSegundos: number | null }[];

  registrosDia: { x: string; y: number }[];
  alertasDia: { x: string; y: number }[];

  // semana
  areaSemanal: { x: string; y: number }[];

  // mes
  barrasMensuales: { label: string; value: number; color: string }[];
}

export function usePosturaEstadisticas(refreshKey: number = 0): PosturaStats {
  const db = useSQLiteContext();
  const { obtener } = useDatabase(db);
  const [registros, setRegistros] = useState<Registro[]>([]);

  // --------------------
  // ----- CARGA ORIGINAL.
  // ---DESCOMENTAR Y BORRAR EL RESTO CUANOD YA NO SE USEN MOCKS

  // useEffect(() => {
  //   obtener().then(setRegistros);
  // }, [refreshKey]);
  // --------------------

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // ------------- INICIO CARGA DATOS MOCKS ------------------------
  // ------- REALES DESDE 13 NOV + INVENTADOS DESDE 15 OCT
  useEffect(() => {
    const cargarFusionado = async () => {
      const reales = await obtener();

      // día actual
      const hoyISO = new Date().toISOString().slice(0, 10);

      // registros reales del día actual
      const realesHoy = reales.filter(
        r => r.fecha.slice(0, 10) === hoyISO
      );

      // DATOS INVENTADOS
      const mocksAnteriores = registrosMock.filter(
        r => r.fecha.slice(0, 10) !== hoyISO
      );

      // fusión ordenada
// carga todos los datos reales del usuario
const fusion = [...registrosMock, ...reales];

      setRegistros(fusion);
    };
    cargarFusionado();
  }, [refreshKey]);

  // ------------- FIN CARGA DATOS MOCKS ------------------------

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

// -----------------------------
    // RANGO FECHAS BASE
    // -----------------------------
    const ahora = new Date();
    const yyyyMMdd = (d: Date) => d.toISOString().slice(0, 10);

    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );

    const hace7 = new Date(hoy);
    hace7.setDate(hoy.getDate() - 6);

    const hace28 = new Date(hoy);
    hace28.setDate(hoy.getDate() - 28);

    const regDia = registros.filter(r => yyyyMMdd(new Date(r.fecha)) === yyyyMMdd(hoy));
    const regUlt7 = registros.filter(r => new Date(r.fecha) >= hace7);
    const regUlt28 = registros.filter(r => new Date(r.fecha) >= hace28);

    // -----------------------------
    // MÉTRICAS GENERALES
    // -----------------------------
    const totalActivaciones = registros.filter(r => r.malaPostura === 1).length;

    const promedioPitch =
      registros.reduce((s, r) => s + Math.abs(r.pitch - r.refPitch), 0) /
      registros.length;

    const promedioRoll =
      registros.reduce((s, r) => s + Math.abs(r.roll - r.refRoll), 0) /
      registros.length;

    const desviacionPromedio = promedioPitch + promedioRoll;

    // -----------------------------
    // STREAK
    // -----------------------------
    const porDia = new Map<string, { total: number; malas: number }>();

    registros.forEach(r => {
      const f = r.fecha.slice(0, 10);
      const it = porDia.get(f) ?? { total: 0, malas: 0 };
      it.total++;
      if (r.malaPostura === 1) it.malas++;
      porDia.set(f, it);
    });

    const diasOrd = Array.from(porDia.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    let streak = 0;
    for (let i = diasOrd.length - 1; i >= 0; i--) {
      const { total, malas } = diasOrd[i][1];
      if (malas / total <= 0.3) streak++;
      else break;
    }

    // -----------------------------
    // DÍA
    // -----------------------------
    const totalDia = regDia.filter(r => r.malaPostura === 1).length;

    const porcentajeMalaDia =
      regDia.length === 0 ? 0 : (totalDia / regDia.length) * 100;

    const porcentajeBuenaDia = 100 - porcentajeMalaDia;

    // DURACIÓN
    const ultimasAlertasDia = (() => {
      const alertas: { hora: string; duracionSegundos: number | null }[] = [];

      for (let i = 1; i < regDia.length; i++) {
        const prev = regDia[i - 1];
        const curr = regDia[i];

        if (prev.malaPostura === 0 && curr.malaPostura === 1) {
          const inicio = new Date(curr.fecha);
          let dur = null;

          for (let j = i + 1; j < regDia.length; j++) {
            if (regDia[j].malaPostura === 0) {
              const fin = new Date(regDia[j].fecha);
              dur = Math.round((fin.getTime() - inicio.getTime()) / 1000);
              break;
            }
          }

          alertas.push({
            hora: inicio.toLocaleTimeString('es-CL', {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: 'America/Santiago'
            }),
            duracionSegundos: dur
          });
        }
      }

      return alertas.slice(-10).reverse();
    })();

    // BUCKETS DEL DÍA
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

    // ======================================================
// 🟢 SEMANA REAL — ÚLTIMOS 7 DÍAS (HOY INCLUIDO)
// Ordenado Lun → Dom, y siempre con 7 puntos
// ======================================================
const areaSemanal = (() => {
  const pastel = [
    "#A8DADC", "#F7CAD0", "#FFD6A5", "#CDB4DB",
    "#B5E48C", "#FFB5A7", "#BDE0FE"
  ];

  const dias = [];

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


// ======================================================
// 🟢 ÚLTIMAS 4 SEMANAS (SEMANA ACTUAL + 3 PREVIAS)
// Cada barra representa todas las alertas (malaPostura=1)
// de cada semana completa
// ------------------------------------------------------
// Semana actual queda AL FINAL (derecha)
// ======================================================
const barrasMensuales = (() => {
  const pastel = [
    "#A8DADC", "#F7CAD0", "#FFD6A5", "#CDB4DB",
    "#B5E48C", "#FFB5A7", "#BDE0FE",
  ];

  // función para obtener lunes de cualquier fecha
  function lunesDe(d: Date): Date {
    const x = new Date(d);
    const dia = x.getDay(); // 0=Dom, 1=Lun...
    const diff = dia === 0 ? -6 : 1 - dia;
    x.setDate(x.getDate() + diff);
    return x;
  }

  const semanas = [0, 0, 0, 0]; // idx = 0 actual, 1=−1 semana...
  const lunesSemanas = [];

  // hoy → lunes actual
  const lunesActual = lunesDe(new Date(hoy));

  lunesSemanas[0] = lunesActual;
  lunesSemanas[1] = new Date(lunesActual.getTime() - 7 * 86400000);
  lunesSemanas[2] = new Date(lunesActual.getTime() - 14 * 86400000);
  lunesSemanas[3] = new Date(lunesActual.getTime() - 21 * 86400000);

  // acumular alertas semana por semana
  regUlt28.forEach(r => {
    const d = new Date(r.fecha);
    const diff = Math.floor((hoy.getTime() - d.getTime()) / 86400000);
    const idx = Math.floor(diff / 7);

    if (idx < 4 && r.malaPostura === 1) semanas[idx]++;
  });

  // formato elegante: “21 Oct”
  const format = (d: Date) =>
    d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });

  // ordenar: más antiguo → más nuevo
  return [
    { label: format(lunesSemanas[3]), value: semanas[3], color: pastel[3] },
    { label: format(lunesSemanas[2]), value: semanas[2], color: pastel[2] },
    { label: format(lunesSemanas[1]), value: semanas[1], color: pastel[1] },
    { label: format(lunesSemanas[0]), value: semanas[0], color: pastel[0] }, // semana actual
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
  }, [registros]);
}