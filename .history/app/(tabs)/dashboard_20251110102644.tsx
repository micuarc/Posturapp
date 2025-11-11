import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  Award,
  RefreshCw,
} from "lucide-react-native";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";

const { width: screenWidth } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  const stats = {
    todayAlerts: 7,
    weeklyImprovement: 12,
    monthlyAvg: 82,
    streak: 5,
  };
  // Pastel palette (varied colors)
  const pastel = [
    "#A8DADC", // verde-agua
    "#F7CAD0", // rosa
    "#FFD6A5", // durazno
    "#CDB4DB", // lila
    "#B5E48C", // verde claro
    "#FFB5A7", // coral pastel
    "#BDE0FE", // celeste
  ];

  const postureData = [
    { x: "Lun", y: 75, label: "Lun" },
    { x: "Mar", y: 68, label: "Mar" },
    { x: "Mié", y: 82, label: "Mié" },
    { x: "Jue", y: 70, label: "Jue" },
    { x: "Vie", y: 88, label: "Vie" },
    { x: "Sáb", y: 92, label: "Sáb" },
    { x: "Dom", y: 85, label: "Dom" },
  ];

  const alertsData = [
    { label: "Lun", value: 12, color: pastel[0] },
    { label: "Mar", value: 15, color: pastel[1] },
    { label: "Mié", value: 8, color: pastel[2] },
    { label: "Jue", value: 10, color: pastel[3] },
    { label: "Vie", value: 5, color: pastel[4] },
    { label: "Sáb", value: 3, color: pastel[5] },
    { label: "Dom", value: 7, color: pastel[6] },
  ];

  const comparisonData = [
    { label: "Sem 1", value: 45, color: pastel[0] },
    { label: "Sem 2", value: 52, color: pastel[1] },
    { label: "Sem 3", value: 68, color: pastel[4] },
    { label: "Sem 4", value: 75, color: pastel[2] },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, María!</Text>
            <Text style={styles.subtitle}>Tu postura mejora cada día</Text>
          </View>

          <Pressable
            onPress={() => router.push("/monitoreo")}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: pressed ? "#FFDCC0" : "#FFE5CC" },
            ]}
          >
            <RefreshCw color="#FF9966" size={20} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangle color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Alertas hoy</Text>
            </View>
            <Text style={styles.statValue}>{stats.todayAlerts}</Text>
            <Text style={styles.statNote}>↓ 3 menos que ayer</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Mejora sem.</Text>
            </View>
            <Text style={styles.statValue}>{stats.weeklyImprovement}%</Text>
            <Text style={styles.statNote}>+2% desde la semana pasada</Text>
          </View>
        </View>

        <View style={styles.selector}>
          {(["day", "week", "month"] as const).map((range) => {
            const active = timeRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={({ pressed }) => [
                  styles.selectorButton,
                  active && styles.selectorButtonActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    active && styles.selectorTextActive,
                  ]}
                >
                  {range === "day"
                    ? "Día"
                    : range === "week"
                    ? "Semana"
                    : "Mes"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ChartContainer
          title="Puntuación de postura"
          description="Evolución de tu postura durante la semana"
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

        <ChartContainer
          title="Alertas por día"
          description="Número de alertas recibidas cada día"
        >
          <BarChart
            data={alertsData}
            config={{
              height: 200,
              showLabels: true,
              animated: true,
              duration: 900,
            }}
          />
        </ChartContainer>

        <ChartContainer
          title="Comparativa semanal"
          description="Progreso de postura entre semanas"
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

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Award color="#FF9966" size={20} />
            <Text style={styles.streakTitle}>Racha de mejora</Text>
          </View>
          <Text style={styles.streakValue}>{stats.streak} días</Text>
          <Text style={styles.streakNote}>
            ¡Sigue así! Estás mejorando tu postura consistentemente
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
    alignContent: "center"
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
