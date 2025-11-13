import React, { useContext, useState, useCallback } from "react";
import { Dimensions, StyleSheet, Image, Modal } from "react-native";
import { Wifi, WifiOff, RefreshCw } from "lucide-react-native";

import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import { SensorContext } from "@/helpers/SensorContext";
import { useDatabase } from "@/hooks/useDatabase";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/helpers/AuthContext";
import { usePosturaEstadisticas } from "@/hooks/usePosturaEstadisticas";

const { lectura, connected, ip } = useContext(SensorContext);
const { width } = Dimensions.get("window");

export default function MonitoreoScreen() {
  const { lectura, connected } = useContext(SensorContext);
  const db = useSQLiteContext();
  const { usuario } = useAuth();
  const { guardar } = useDatabase(db);
  const stats = usePosturaEstadisticas(0); // Usar las mismas estadísticas que dashboard

  const [isCalibratingModal, setIsCalibratingModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // postura correcta real: viene del ESP
  const posturaCorrecta = lectura?.malaPostura === 0;

  const iniciarCalibracion = useCallback(async () => {
    setIsCalibratingModal(true);
    setCountdown(5);

    for (let i = 5; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }

    try {
      await fetch(`http://${ip}/calibrate`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("Calibración solicitada");
    } catch (e) {
      console.error("Error calibrando:", e);
    } finally {
      setIsCalibratingModal(false);
    }
  }, []);

  const handleGuardarManual = useCallback(async () => {
    if (!lectura) return;
    
    try {
      await guardar(lectura);
      console.log("Registro manual guardado.");
    } catch (e) {
      console.error("Error guardando manual:", e);
    }
  }, [lectura, guardar]);

  const colorPostura = posturaCorrecta ? "#A0D8A0" : "#FF9999";
  const colorTextoPostura = posturaCorrecta ? "#57bd57ff" : "#e94d4dff";
  const imagenPostura = posturaCorrecta
    ? require("../../assets/images/buena postura.png")
    : require("../../assets/images/mala postura.png");
  const textoPostura = posturaCorrecta
    ? "Postura correcta"
    : "Postura incorrecta";

  const ultimaMedicion = new Date();

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

      {/* ENCABEZADO */}
      <View style={styles.header}>
        <View>
          <Text variant="heading" style={styles.title}>
            Monitoreo
          </Text>
          <Text variant="subtitle" style={styles.subtitle}>
            Estado en tiempo real
          </Text>
        </View>

        <Button
          icon={RefreshCw}
          size="icon"
          style={styles.refreshButton}
          onPress={() => console.log('Las estadísticas se actualizan automáticamente')}
        />
      </View>

      {/* ESTADO DE CONEXIÓN */}
      <View style={styles.estadoConexion}>
        <View
          style={[
            styles.indicadorConexion,
            { backgroundColor: connected ? "#A0D8A0" : "#C0C0C0" },
          ]}
        />
        <Text style={styles.textoConexion}>
          {connected ? "Dispositivo conectado" : "Dispositivo desconectado"}
        </Text>
        {connected ? (
          <Wifi color="#A0D8A0" size={20} />
        ) : (
          <WifiOff color="#C0C0C0" size={20} />
        )}
      </View>

      {/* POSTURA */}
      <View style={styles.estadoPostura}>
        <View
          style={[styles.circuloExterior, { backgroundColor: colorPostura }]}
        >
          <View style={styles.circuloMedio}>
            <View style={styles.circuloInterior}>
              <Image source={imagenPostura} style={styles.imagenPostura} />
            </View>
          </View>
        </View>

        <Text
          variant="title"
          style={[styles.textoPostura, { color: colorTextoPostura }]}
        >
          {textoPostura}
        </Text>

        <Text variant="caption" style={styles.textoHora}>
          Última actualización:{" "}
          {ultimaMedicion.getHours().toString().padStart(2, '0')}:
          {ultimaMedicion.getMinutes().toString().padStart(2, '0')}
        </Text>
      </View>

      {/* LECTURA REAL EN TIEMPO REAL */}
      {lectura && (
        <View style={styles.datosContainer}>
          <Text style={styles.dato}>Pitch: {lectura.pitch.toFixed(2)}°</Text>
          <Text style={styles.dato}>Roll: {lectura.roll.toFixed(2)}°</Text>
          <Text style={styles.dato}>
            Ref Pitch: {lectura.refPitch.toFixed(2)}°
          </Text>
          <Text style={styles.dato}>
            Ref Roll: {lectura.refRoll.toFixed(2)}°
          </Text>
          <Text style={styles.dato}>
            Calibrando: {lectura.calibrating === 1 ? "Sí" : "No"}
          </Text>
        </View>
      )}

      {/* TABLA DE REGISTROS */}
      <View style={styles.alertasContainer}>
        <Text variant="title" style={styles.alertasTitulo}>
          Últimas alertas de mala postura
        </Text>

        {stats.ultimasAlertasDia.length === 0 ? (
          <View style={[styles.alertasLista, { padding: 20 }]}>
            <Text style={styles.alertaTipo}>No hay alertas hoy</Text>
          </View>
        ) : (
          <View style={styles.alertasLista}>
            {stats.ultimasAlertasDia.slice(0, 10).map((alerta, idx) => (
              <View key={`${alerta.hora}-${idx}`} style={styles.alertaFila}>
                <Text style={styles.alertaTipo}>{alerta.hora}</Text>
                <Text style={styles.alertaHora}>
                  {alerta.duracionSegundos != null
                    ? `${alerta.duracionSegundos}s`
                    : "Sin corrección"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* BOTONES */}
      <View style={styles.controlButtons}>

        <Button
          size="lg"
          variant="default"
          style={[styles.botonTest, { backgroundColor: "#6FCF97" }]}
          onPress={iniciarCalibracion}
        >
          Calibrar postura buena
        </Button>

        <Button
          size="lg"
          variant="default"
          style={styles.botonTest}
          onPress={handleGuardarManual}
        >
          Registrar ahora
        </Button>
      </View>

      {/* MODAL CALIBRACIÓN */}
      <Modal visible={isCalibratingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mantén postura neutra</Text>
            <Text style={styles.modalSubtitle}>
              Calibrando en {countdown} s...
            </Text>
            <Text style={styles.modalCountdown}>{countdown}</Text>

            <Button
              style={styles.modalCancelBtn}
              onPress={() => setIsCalibratingModal(false)}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },

  title: {
    color: "#8B5A2B",
    fontWeight: "700",
    fontSize: 32,
    marginBottom: 4,
  },

  subtitle: {
    color: "#A0522D",
    opacity: 0.8,
    fontSize: 16,
    marginBottom: 12,
  },

  refreshButton: {
    backgroundColor: "#FF9966",
    borderRadius: 100,
  },

  estadoConexion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
  },

  indicadorConexion: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },

  textoConexion: {
    flex: 1,
    color: "#8B5A2B",
    fontWeight: "600",
  },

  estadoPostura: {
    alignItems: "center",
    marginBottom: 30,
  },

  circuloExterior: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  circuloMedio: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: width * 0.24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  circuloInterior: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    backgroundColor: "#FFF9F2",
    alignItems: "center",
    justifyContent: "center",
  },

  imagenPostura: {
    resizeMode: "contain",
    width: "100%",
    height: "100%",
  },

  textoPostura: {
    fontWeight: "700",
    marginBottom: 4,
  },

  textoHora: {
    color: "#A0522D",
  },

  datosContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  dato: {
    color: "#8B5A2B",
    fontWeight: "600",
    marginVertical: 2,
  },

  alertasContainer: {
    marginBottom: 20,
  },

  alertasTitulo: {
    color: "#8B5A2B",
    fontWeight: "700",
    marginBottom: 10,
  },

  alertasLista: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#FFE5CC",
  },

  alertaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },

  alertaHora: {
    color: "#8B5A2B",
    fontWeight: "600",
  },

  alertaTipo: {
    color: "#A0522D",
  },

  controlButtons: {
    gap: 12,
    marginBottom: 80,
  },

  botonTest: {
    backgroundColor: "#FF9966",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },

  modalTitle: {
    color: "#8B5A2B",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  modalSubtitle: {
    color: "#A0522D",
    fontSize: 16,
    marginBottom: 20,
  },

  modalCountdown: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF9966",
    color: "#FFF",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
  },

  modalCancelBtn: {
    marginTop: 24,
    backgroundColor: "#E57373",
    borderRadius: 12,
  },
});
