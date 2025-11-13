import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, TextInput, Platform } from "react-native";
import { Wifi, WifiOff, Vibrate, Bell, Volume2, Settings } from "lucide-react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SensorContext } from "@/helpers/SensorContext";
import { NativeModules } from "react-native";
import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";

const { Postura } = NativeModules;

export default function SensorSettingsScreen() {
  const db = useSQLiteContext();
  const { connected, ip } = useContext(SensorContext);

  const [selectedFeedback, setSelectedFeedback] = useState<string[]>(["vibration"]);
  const [lastSync, setLastSync] = useState("--");
  const [ipInput, setIpInput] = useState("");

  const sendConfigToNative = (values: string[]) => {
    if (Platform.OS !== "android" || !Postura) return;
    const vibrate = values.includes("vibration");
    const notify = values.includes("notification");
    const sound = values.includes("sound");
    Postura.setFeedbackConfig(vibrate, notify, sound);
  };

  useEffect(() => {
    const loadConfig = async () => {
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM configuracion WHERE key = ?",
        ["feedback_type"]
      );
      const saved = row?.value ? JSON.parse(row.value) : ["vibration"];
      setSelectedFeedback(saved);
      sendConfigToNative(saved);

      const ipRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM configuracion WHERE key = ?",
        ["sensor_ip"]
      );
      if (ipRow?.value) setIpInput(ipRow.value);
    };
    loadConfig();
  }, [db]);

  const toggleFeedback = async (value: string) => {
    const newSel = selectedFeedback.includes(value)
      ? selectedFeedback.filter((v) => v !== value)
      : [...selectedFeedback, value];

    setSelectedFeedback(newSel);

    await db.runAsync(
      `INSERT INTO configuracion(key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ["feedback_type", JSON.stringify(newSel)]
    );

    sendConfigToNative(newSel);
  };

  const guardarIp = async () => {
    if (!ipInput.trim()) return;

    try {
      await db.runAsync(
        `INSERT INTO configuracion(key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        ["sensor_ip", ipInput.trim()]
      );

      // Iniciar el servicio nativo con la nueva IP
      if (Platform.OS === "android" && Postura) {
        try {
          Postura.startService(ipInput.trim());
          console.log("Servicio reiniciado con nueva IP:", ipInput.trim());
        } catch (e) {
          console.log("Error reiniciando servicio:", e);
        }
      }

      // Mensaje de confirmación (podrías agregar un Toast aquí)
      console.log("IP guardada correctamente:", ipInput.trim());
    } catch (e) {
      console.log("Error guardando IP:", e);
    }
  };

  const feedbackOptions = [
    { id: "vibration", label: "Vibración", icon: Vibrate },
    { id: "notification", label: "Notificación", icon: Bell },
    { id: "sound", label: "Sonido", icon: Volume2 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza la app y el dispositivo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de Feedback</Text>
          <Text style={styles.cardSubtitle}>Selecciona cómo se alerta</Text>

          <View style={styles.feedbackRow}>
            {feedbackOptions.map((op) => {
              const IconComp = op.icon;
              const active = selectedFeedback.includes(op.id);
              return (
                <TouchableOpacity
                  key={op.id}
                  style={[styles.feedbackBtn, active ? styles.fbActive : styles.fbInactive]}
                  onPress={() => toggleFeedback(op.id)}
                >
                  <IconComp color={active ? "#FFF" : "#8B5A2B"} size={28} />
                  <Text style={[styles.fbLabel, active ? styles.fbLabelA : styles.fbLabelI]}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configurar IP del Sensor</Text>
          <Text style={styles.cardSubtitle}>Usa la IP mostrada por el ESP32</Text>

          <TextInput
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="192.168.x.x"
            style={styles.input}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={guardarIp}>
            <Text style={styles.saveBtnText}>Guardar IP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del Dispositivo</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Settings size={20} color="#FF9966" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Dirección IP</Text>
              <Text style={styles.infoValue}>{ip || "No configurada"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              {connected ? (
                <Wifi size={20} color="#FF9966" />
              ) : (
                <WifiOff size={20} color="#FF9966" />
              )}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Estado de conexión</Text>
              <Text style={styles.infoValue}>{connected ? "Conectado" : "Desconectado"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Settings size={20} color="#FF9966" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Última sincronización</Text>
              <Text style={styles.infoValue}>{lastSync}</Text>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F2" },
  inner: { padding: 24, paddingTop: 48 },

  header: { marginBottom: 10 },
  title: { fontSize: 32, fontWeight: "700", color: "#8B5A2B" },
  subtitle: { fontSize: 16, color: "#A0522D", opacity: 0.8, marginBottom: 12 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginBottom: 18,
  },

  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#8B5A2B", marginBottom: 6 },
  cardSubtitle: { color: "#A0522D", marginBottom: 14 },

  feedbackRow: { flexDirection: "row", justifyContent: "space-between" },

  feedbackBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 4,
  },

  fbActive: { backgroundColor: "#FF9966" },
  fbInactive: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E0E0E0" },

  fbLabel: { marginTop: 6, fontWeight: "600", fontSize: 10 },
  fbLabelA: { color: "#FFF" },
  fbLabelI: { color: "#8B5A2B" },

  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    backgroundColor: "#FFF",
    borderRadius: 14,
    fontSize: 16,
    color: "#8B5A2B",
    marginBottom: 12,
  },

  saveBtn: {
    backgroundColor: "#FF9966",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  infoIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#FFF5E6", justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#A0522D" },
  infoValue: { fontSize: 16, color: "#8B5A2B", fontWeight: "600" },
});
