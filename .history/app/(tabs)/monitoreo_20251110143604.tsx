import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Image } from "react-native";
import { Wifi, WifiOff, RefreshCw } from "lucide-react-native";
import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useSyncPostura } from "@/hooks/useSyncPostura";
import { usePosturaEstadisticas } from "@/hooks/usePosturaEstadisticas";

// PARA VER DATOS DE DB
import * as SQLite from "expo-sqlite";

function logDatabase() {
  const db = SQLite.openDatabase("postura.db");

  db.transaction((tx) => {
    tx.executeSql(
      "SELECT * FROM registros ORDER BY fecha DESC;",
      [],
      (_, { rows }) => console.log("📄 Datos en la base:", rows._array),
      (_, err) => {
        console.error("Error leyendo base de datos:", err);
        return true;
      }
    );
  });
}

const { width } = Dimensions.get("window");

export default function MonitoreoScreen() {
  const ESP_IP = "192.168.1.16";

  const { connected, lectura, posturaCorrecta, activaciones, minutos } =
    useSyncPostura(ESP_IP);

  // Carga de métricas históricas desde la BD
  const {
    totalActivaciones,
    desviacionPromedio,
    promedioPitch,
    promedioRoll,
    streak,
  } = usePosturaEstadisticas();

  useEffect(() => {
    const db = SQLite.openDatabase("postura.db");

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM registros ORDER BY fecha DESC;",
        [],
        (_, { rows }) => {
          console.log("📄 Datos actuales:", rows._array);
        },
        (_, err) => {
          console.error("Error leyendo base de datos:", err);
          return true;
        }
      );
    });
  }, []);

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
      {/* Encabezado */}
      <View style={[styles.header, { flexDirection: "row" }]}>
        <View>
          <Text variant="heading" style={styles.title}>
            Monitoreo
          </Text>
          <Text variant="subtitle" style={styles.subtitle}>
            Estado en tiempo real
          </Text>
        </View>
        <Button icon={RefreshCw} size="icon" style={styles.refreshButton} />
      </View>

      {/* Estado de conexión */}
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

      {/* Estado de postura */}
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
          {ultimaMedicion.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Datos en tiempo real */}
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
        </View>
      )}

      {/* Métricas en vivo + históricas */}
      <View style={styles.alertasContainer}>
        <Text variant="title" style={styles.alertasTitulo}>
          Métricas actuales
        </Text>

        <View style={styles.alertasLista}>
          <View style={styles.alertaFila}>
            <Text style={styles.alertaTipo}>Minutos en sesión</Text>
            <Text style={styles.alertaHora}>{Math.trunc(minutos)}</Text>
          </View>

          <View style={styles.alertaFila}>
            <Text style={styles.alertaTipo}>Alertas (actual sesión)</Text>
            <Text style={styles.alertaHora}>{activaciones}</Text>
          </View>

          <View style={styles.alertaFila}>
            <Text style={styles.alertaTipo}>Alertas totales (histórico)</Text>
            <Text style={styles.alertaHora}>{totalActivaciones}</Text>
          </View>

          <View style={styles.alertaFila}>
            <Text style={styles.alertaTipo}>Desviación promedio</Text>
            <Text style={styles.alertaHora}>
              {desviacionPromedio.toFixed(1)}°
            </Text>
          </View>

          <View style={styles.alertaFila}>
            <Text style={styles.alertaTipo}>Racha de mejora</Text>
            <Text style={styles.alertaHora}>{streak} días</Text>
          </View>
        </View>
      </View>

      {/* Botones de control */}
      <View style={styles.controlButtons}>
        <Button
          size="lg"
          variant="default"
          style={[styles.botonTest, { backgroundColor: "#6FCF97" }]}
          onPress={async () => {
            try {
              await fetch(`http://${ESP_IP}/calibrate`);
              console.log("Calibración iniciada");
            } catch (e) {
              console.error("Error al calibrar:", e);
            }
          }}
        >
          Calibrar postura buena
        </Button>

        <Button
          size="lg"
          variant="default"
          style={styles.botonTest}
          onPress={() => {logDatabase()}}
        >
          ver database
        </Button>

        {/* Botón manual */}
        <Button
          size="lg"
          variant="default"
          style={styles.botonTest}
          onPress={() => {
            console.log("Guardado manual (useDatabase interno)");
          }}
        >
          Registrar ahora
        </Button>
      </View>
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
    alignItems: "center",
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
    marginBottom: 30,
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
  botonTest: {
    marginBottom: 80,
    backgroundColor: "#FF9966",
  },
  controlButtons: {
    gap: 12,
    marginBottom: 80,
  },
});
