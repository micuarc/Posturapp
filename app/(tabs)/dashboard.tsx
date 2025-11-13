import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  TrendingUp,
  AlertTriangle,
  Award,
  RefreshCw,
  BarChart3,
  User,
} from "lucide-react-native";

import { useAuth } from "@/helpers/AuthContext";
import { usePosturaEstadisticas } from "@/hooks/usePosturaEstadisticas";

// Charts
import { ProgressRingChart } from "@/components/charts/progress-ring-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";

export default function DashboardScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = usePosturaEstadisticas(refreshKey);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [usuario?.id])
  );

  if (!usuario) {
    return (
      <ScrollView style={styles.container}>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <User color="#FF9966" size={64} />
          <Text style={styles.noUserTitle}>Acceso restringido</Text>
          <Text style={styles.noUserSubtitle}>
            Inicia sesión para ver tus métricas
          </Text>
          <Pressable
            style={styles.loginPromptButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginPromptText}>Iniciar Sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              {stats.totalActivaciones} alertas registradas
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: pressed ? "#FFDCC0" : "#FFE5CC" },
            ]}
          >
            <RefreshCw color="#FF9966" size={20} />
          </Pressable>
        </View>

        {/* ESTADÍSTICAS PRINCIPALES */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangle color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Alertas totales</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalActivaciones}</Text>
            <Text style={styles.statNote}>Acumulado general</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp color="#FF9966" size={18} />
              <Text style={styles.statTitle}>Desv. promedio</Text>
            </View>
            <Text style={styles.statValue}>
              {stats.desviacionPromedio.toFixed(1)}°
            </Text>
            <Text style={styles.statNote}>Pitch + Roll</Text>
          </View>
        </View>

        {/* SELECTOR */}
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

        {/* ============== DÍA ============== */}
        {timeRange === "day" && (
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <AlertTriangle color="#FF9966" size={24} />
              <Text style={styles.cardTitle}>Postura del día</Text>
            </View>

            <ProgressRingChart
              progress={stats.porcentajeMalaDia}
              size={180}
              strokeWidth={16}
              config={{
                animated: true,
                duration: 1200,
                gradient: true,
              }}
              style={{ alignSelf: "center", marginBottom: 8 }}
              centerText={`${Math.round(stats.porcentajeMalaDia)}%`}
            />

            <Text style={styles.centerText}>
              {stats.porcentajeBuenaDia.toFixed(0)}% correcta /{" "}
              {stats.porcentajeMalaDia.toFixed(0)}% incorrecta
            </Text>

            <Text style={styles.centerSubText}>
              Alertas del día: {stats.totalDia}
            </Text>

            {/* Tabla últimas alertas */}
            <View style={styles.alertsTable}>
              <Text style={styles.alertsTitle}>
                Últimas alertas de mala postura
              </Text>

              {stats.ultimasAlertasDia.length === 0 && (
                <Text style={styles.noAlertsText}>
                  Aún no se han registrado alertas hoy.
                </Text>
              )}

              {stats.ultimasAlertasDia.map((a, idx) => (
                <View key={`${a.hora}-${idx}`} style={styles.alertRow}>
                  <Text style={styles.alertTime}>{a.hora}</Text>
                  <Text style={styles.alertDesc}>
                    {a.duracionSegundos != null
                      ? `Alerta corregida en ${a.duracionSegundos}s`
                      : "Alerta sin registro de corrección"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============ SEMANA ============ */}
        {timeRange === "week" && (
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <TrendingUp color="#FF9966" size={24} />
              <Text style={styles.cardTitle}>Intensidad semanal</Text>
            </View>

            <AreaChart
              data={stats.areaSemanal}
              config={{
                height: 200,
                animated: true,
                duration: 1500,
                gradient: true,
                lineColor: "#FF9966",
                pointColor: "#FF9966",
                startFillColor: "#FF996660",
                endFillColor: "#FF996600",
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* ============= MES ============== */}
        {timeRange === "month" && (
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <BarChart3 color="#FF9966" size={24} />
              <Text style={styles.cardTitle}>Alertas por día (mes)</Text>
            </View>

            <BarChart
              data={stats.barrasMensuales}
              config={{
                height: 220,
                animated: true,
                duration: 900,
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* RACHA */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Award color="#FF9966" size={20} />
            <Text style={styles.streakTitle}>Racha de mejora</Text>
          </View>
          <Text style={styles.streakValue}>{stats.streak} días</Text>
        </View>

        {/* BOTÓN MONITOREO */}
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/monitoreo")}
        >
          <Text style={styles.actionButtonText}>Ir a Monitoreo</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F2" },
  inner: { padding: 20, paddingTop: 48, paddingBottom: 80 },

  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#8B5A2B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0522D",
    opacity: 0.8,
    marginBottom: 12,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  noUserTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5A2B",
    marginTop: 16,
    textAlign: "center",
  },
  noUserSubtitle: {
    fontSize: 16,
    color: "#A0522D",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  loginPromptButton: {
    backgroundColor: "#FF9966",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  loginPromptText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
  },
  statHeader: { flexDirection: "row", gap: 8, marginBottom: 6 },
  statTitle: { color: "#8B5A2B", fontWeight: "700" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#8B5A2B" },
  statNote: { fontSize: 12, color: "#A0522D" },

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

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginBottom: 16,
  },
  cardHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#8B5A2B" },

  chart: { borderRadius: 8 },

  centerText: {
    marginTop: 4,
    textAlign: "center",
    color: "#8B5A2B",
    fontWeight: "700",
  },
  centerSubText: {
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
    color: "#A0522D",
    fontSize: 13,
  },

  alertsTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: "#FFFDF9",
  },
  alertsTitle: {
    fontWeight: "700",
    color: "#8B5A2B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  noAlertsText: {
    padding: 12,
    color: "#A0522D",
    fontSize: 13,
  },
  alertRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  alertTime: {
    width: 60,
    fontWeight: "700",
    color: "#8B5A2B",
  },
  alertDesc: {
    flex: 1,
    color: "#A0522D",
    fontSize: 13,
  },

  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginBottom: 16,
  },
  streakHeader: { flexDirection: "row", gap: 8, marginBottom: 8 },
  streakTitle: { color: "#8B5A2B", fontWeight: "700" },
  streakValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#8B5A2B",
    textAlign: "center",
  },

  actionButton: {
    backgroundColor: "#FF9966",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
