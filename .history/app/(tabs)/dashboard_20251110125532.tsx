import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp, AlertTriangle, Award, RefreshCw } from "lucide-react-native";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { useDatabase, Registro } from "@/hooks/useDatabase";
import { usePosturaStats } from "@/hooks/usePosturaStats";

const { width: screenWidth } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const { obtener } = useDatabase();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    obtener().then(setRegistros);
  }, []);

  // colores suaves
  const pastel = [
    "#A8DADC",
    "#F7CAD0",
    "#FFD6A5",
    "#CDB4DB",
    "#B5E48C",
    "#FFB5A7",
    "#BDE0FE",
  ];

  // ---- Datos calculados ----
  const totalActivaciones = registros.reduce((sum, r) => sum + r.activaciones, 0);
  const promedioPitch =
    registros.length > 0
      ? registros.reduce((s, r) => s + Math.abs(r.pitch - r.refPitch), 0) / registros.length
      : 0;
  const promedioRoll =
    registros.length > 0
      ? registros.reduce((s, r) => s + Math.abs(r.roll - r.refRoll), 0) / registros.length
      : 0;

  const streak = Math.min(7, registros.length); // ejemplo simple

  // datos para gráfico de postura (promedio diario de desviación)
  const postureData = registros.map((r, i) => ({
    x: `#${i + 1}`,
    y: Math.abs(r.pitch - r.refPitch) + Math.abs(r.roll - r.refRoll),
  }));

  // datos para gráfico de alertas (activaciones diarias)
  const alertsData = registros.map((r, i) => ({
    label: `#${i + 1}`,
    value: r.activaciones,
    color: pastel[i % pastel.length],
  }));

  // comparativa semanal: agrupar por bloques de 7 días
  const weeks: { label: string; value: number }[] = [];
  for (let i = 0; i < registros.length; i += 7) {
    const chunk = registros.slice(i, i + 7);
    const avg = chunk.reduce((s, r) => s + r.activaciones, 0) / (chunk.length || 1);
    weeks.push({ label: `Sem ${weeks.length + 1}`, value: avg });
  }

  const comparisonData = weeks.map((w, i) => ({
    label: w.label,
    value: w.value,
    color: pastel[i % pastel.length],
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel de seguimiento</Text>
            <Text style={styles.subtitle}>Datos reales desde el sensor</Text>
          </View>
          <Pressable
            onPress={() => obtener().then(setRegistros)}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: pressed ? "#FFDCC0" : "#FFE5CC" },
            ]}
          >
            <RefreshCw color="#FF9966" size={20} />
          </Pressable>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangle color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Alertas totales</Text>
            </View>
            <Text style={styles.statValue}>{totalActivaciones}</Text>
            <Text style={styles.statNote}>Registradas en esta sesión</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Desv. promedio</Text>
            </View>
            <Text style={styles.statValue}>
              {(promedioPitch + promedioRoll).toFixed(1)}°
            </Text>
            <Text style={styles.statNote}>Pitch + Roll</Text>
          </View>
        </View>

        {/* Selector */}
        <View style={styles.selector}>
          {(["day", "week", "month"] as const).map((range) => {
            const active = timeRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={[
                  styles.selectorButton,
                  active && styles.selectorButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    active && styles.selectorTextActive,
                  ]}
                >
                  {range === "day" ? "Día" : range === "week" ? "Semana" : "Mes"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Área: evolución de postura */}
        <ChartContainer
          title="Desviación de postura"
          description="Promedio de variación (pitch + roll)"
        >
          <AreaChart
            data={postureData}
            config={{
              height: 220,
              showGrid: true,
              showLabels: true,
              animated: true,
              interactive: true,
              showYLabels: true,
              yLabelCount: 4,
              lineColor: "#FF9966",
              pointColor: "#FF9966",
              startFillColor: "#FFE5CC",
              endFillColor: "#FFF9F2",
            }}
          />
        </ChartContainer>

        {/* Barras: alertas */}
        <ChartContainer
          title="Alertas por registro"
          description="Cantidad de activaciones por período"
        >
          <BarChart
            data={alertsData}
            config={{
              height: 200,
              showLabels: true,
              animated: true,
              duration: 1000,
            }}
          />
        </ChartContainer>

        {/* Barras: comparación semanal */}
        <ChartContainer
          title="Comparativa semanal"
          description="Promedio de alertas por semana"
        >
          <BarChart
            data={comparisonData}
            config={{
              height: 200,
              showLabels: true,
              animated: true,
              duration: 1000,
            }}
          />
        </ChartContainer>

        {/* Racha */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Award color="#FF9966" size={20} />
            <Text style={styles.streakTitle}>Racha de mejora</Text>
          </View>
          <Text style={styles.streakValue}>{streak} días</Text>
          <Text style={styles.streakNote}>
            Mantén tu progreso constante
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F2" },
  inner: { padding: 20, paddingTop: 48, paddingBottom: 80 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  greeting: { fontSize: 26, fontWeight: "700", color: "#8B5A2B" },
  subtitle: { color: "#A0522D", marginTop: 2 },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    justifyContent: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statTitle: { color: "#8B5A2B", fontWeight: "700" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#8B5A2B" },
  statNote: { fontSize: 12, color: "#A0522D", marginTop: 6 },
  selector: {
    flexDirection: "row",
    backgroundColor: "#ffeacae7",
    borderRadius: 14,
    padding: 6,
    marginBottom: 16,
  },
  selectorButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectorButtonActive: { backgroundColor: "#FF9966" },
  selectorText: { fontWeight: "700", color: "#8B5A2B" },
  selectorTextActive: { color: "#FFFFFF" },
  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  streakTitle: { color: "#8B5A2B", fontWeight: "700" },
  streakValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#8B5A2B",
    textAlign: "center",
    marginBottom: 6,
  },
  streakNote: { color: "#A0522D", textAlign: "center" },
});
