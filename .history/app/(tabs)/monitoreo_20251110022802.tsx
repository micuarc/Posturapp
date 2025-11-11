import React, { useState } from "react";
import { Dimensions, StyleSheet, Image } from "react-native";
import { Wifi, WifiOff, RefreshCw } from "lucide-react-native";
import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useColor } from "@/hooks/useColor";

const { width } = Dimensions.get("window");

export default function MonitoreoScreen() {
  const [conectado, setConectado] = useState(true);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [ultimaMedicion, setUltimaMedicion] = useState(new Date());

  const primary = useColor("primary");
  const border = useColor("border");
  const card = useColor("card");

  const alertas = [
    { id: 1, hora: "10:30", tipo: "Postura incorrecta", nivel: "alta" },
    { id: 2, hora: "09:45", tipo: "Ajuste menor", nivel: "media" },
    { id: 3, hora: "08:15", tipo: "Postura correcta", nivel: "baja" },
  ];

  const forzarTest = () => {
    setPosturaCorrecta(!posturaCorrecta);
    setUltimaMedicion(new Date());
  };

  const colorPostura = posturaCorrecta ? "#A0D8A0" : "#FF9999";
  const colorTextoPostura = posturaCorrecta ? "#57bd57ff" : "#e94d4dff";
  const imagenPostura = posturaCorrecta ? require("../../assets/images/buena postura.png") : require("../../assets/images/mala postura.png");
  const textoPostura = posturaCorrecta
    ? "Postura correcta"
    : "Postura incorrecta";

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <View style={[styles.header, {flexDirection: "row"}]}>
        <View>
          <Text variant="heading" style={styles.title}>
            Monitoreo
          </Text>
          <Text variant="subtitle" style={styles.subtitle}>
            Estado en tiempo real
          </Text>
        </View>
        <View>
          <Button
            icon={RefreshCw}
            size="icon"
            style={styles.refreshButton}
            onPress={() => forzarTest()}
          />
        </View>
      </View>

      {/* Estado de conexión */}
      <View
        style={[
          styles.estadoConexion,
        ]}
      >
        <View
          style={[
            styles.indicadorConexion,
            { backgroundColor: conectado ? "#A0D8A0" : "#C0C0C0" },
          ]}
        />
        <Text style={styles.textoConexion}>
          {conectado ? "Dispositivo conectado" : "Dispositivo desconectado"}
        </Text>
        {conectado ? (
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
              {/* Figura humana simple */}
              {}
               <Image source={imagenPostura} style={styles.imagenPostura}/> 
            </View>
            </View>
          </View>


        <Text variant="title" style={[styles.textoPostura, { color: colorTextoPostura }]}>
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

      {/* Alertas recientes */}
      <View style={styles.alertasContainer}>
        <Text variant="title" style={styles.alertasTitulo}>
          Alertas recientes
        </Text>

        <View style={[styles.alertasLista, { borderColor: border }]}>
          {alertas.map((alerta, i) => (
            <View key={alerta.id} style={styles.alertaFila}>
              <View
                style={[
                  styles.alertaNivel,
                  {
                    backgroundColor:
                      alerta.nivel === "alta"
                        ? "#FF9999"
                        : alerta.nivel === "media"
                        ? "#FFCC99"
                        : "#A0D8A0",
                  },
                ]}
              />
              <View style={styles.alertaTextoContainer}>
                <Text style={styles.alertaHora}>{alerta.hora}</Text>
                <Text style={styles.alertaTipo}>{alerta.tipo}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Botón de test */}
      <Button
        size="lg"
        variant="default"
        style={styles.botonTest}
        onPress={forzarTest}
      >
        Forzar test
      </Button>
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
    borderColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,

  },
  indicadorConexion: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    borderColor: "#FFFFFF",
  },
  textoConexion: {
    flex: 1,
    color: "#8B5A2B",
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
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
    resizeMode: 'contain',
    width: '100%',
    height: '100%',
    marginBottom: 8,
  },
  textoPostura: {
    color: "#8B5A2B",
    fontWeight: "700",
    marginBottom: 4,
  },
  textoHora: {
    color: "#A0522D",
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
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  alertaNivel: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  alertaTextoContainer: {
    flex: 1,
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
});
