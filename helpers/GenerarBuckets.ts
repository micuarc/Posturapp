import { Registro } from "@/hooks/useDatabase";

export function generarBuckets(inicio: Date, fin: Date, buckets = 10) {
  const lista: Date[] = [];

  const diff = fin.getTime() - inicio.getTime();
  const step = diff / (buckets - 1);

  for (let i = 0; i < buckets; i++) {
    lista.push(new Date(inicio.getTime() + i * step));
  }

  return lista;
}

export function asignarABuckets(
  regs: Registro[],
  buckets: Date[],
  mapper: (r: Registro) => number
) {
  if (regs.length === 0) return [];

  const puntos = [];

  for (let i = 0; i < buckets.length - 1; i++) {
    const ini = buckets[i].getTime();
    const fin = buckets[i + 1].getTime();

    const dentro = regs.filter(r => {
      const t = new Date(r.fecha).getTime();
      return t >= ini && t < fin;
    });

    const y =
      dentro.length === 0
        ? 0
        : dentro.reduce((s, r) => s + mapper(r), 0) / dentro.length;

    const label = buckets[i].toTimeString().slice(0, 5); // HH:mm

    puntos.push({ x: label, y });
  }

  return puntos;
}