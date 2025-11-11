import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp, AlertTriangle, Award, RefreshCw } from "lucide-react-native";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { usePosturaEstadisticas } from "@/hooks/usePosturaEstadisticas";

export default function DashboardScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const {
    totalActivaciones,
    promedioPitch,
    promedioRoll,
    desviacionPromedio,
    streak,
    postureData,
    alertsData,
    comparisonData,
  } = usePosturaEstadisticas();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel de seguimiento</Text>
            <Text style={styles.subtitle}>Datos reales desde el sensor</Text>
          </View>
          <Pressable
            onPress={() => router.replace("/dashboard")}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: pressed ? "#FFDCC0" : "#FFE5CC" },
            ]}
          >
            <RefreshCw color="#FF9966" size={20} />
          </Pressable>
        </View>

        {/* Estadísticas principales */}
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
            <Text style={styles.statValue}>{desviacionPromedio.toFixed(1)}°</Text>
            <Text style={styles.statNote}>Pitch + Roll</Text>
          </View>
        </View>

        {/* Selector de rango */}
        <View style={styles.selector}>
          {(["day", "week", "month"] as const).map((range) => {
            const active = timeRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.selectorButton, active && styles.selectorButtonActive]}
              >
                <Text
                  style={[styles.selectorText, active && styles.selectorTextActive]}
                >
                  {range === "day" ? "Día" : range === "week" ? "Semana" : "Mes"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Gráfico de desviación */}
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

        {/* Gráfico de alertas */}
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

        {/* Comparativa semanal */}
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
          <Text style={styles.streakNote}>Mantén tu progreso constante</Text>
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
