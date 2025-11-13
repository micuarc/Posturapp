import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Calendar, Save, X, ChevronDown, Ruler, Weight, Dumbbell, Percent } from "lucide-react-native";
import { useAuth } from "@/helpers/AuthContext";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { useCargaPerfil } from "@/hooks/useCargaPerfil";
import { useSQLiteContext } from "expo-sqlite";
import { normalizarCaseString } from "@/helpers/NormalizarCaseString";
import { Image } from "@/components/ui/image";
import { USER_ICONS, getUserIconSource } from "@/helpers/UserIcons";

const OPCIONES_GENERO = [
  { label: "Hombre", value: "Hombre" },
  { label: "Mujer", value: "Mujer" },
  { label: "No Binario", value: "No Binario" },
];

// Componente de campo con etiqueta unificada
function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const db = useSQLiteContext();
  
  const { perfil, cargarPerfil, guardarPerfil } = useCargaPerfil(db, usuario?.id);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [genero, setGenero] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [porcMusculo, setPorcMusculo] = useState("");
  const [porcGrasa, setPorcGrasa] = useState("");
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIconDraft, setSelectedIconDraft] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || "");
      setApellido(perfil.apellido || "");
      setFechaNacimiento(perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento) : null);
      setGenero(perfil.genero || "");
      setAltura(perfil.alturaCm || "");
      setPeso(perfil.pesoKg || "");
      setPorcMusculo(perfil.porcMusculo || "");
      setPorcGrasa(perfil.porcGrasa || "");
      setUserIcon(perfil.userIcon || null);
    }
  }, [perfil]);

  const validateNumber = (value: string): string => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const validatedValue = validateNumber(value);
    setter(validatedValue);
  };

  const getGenderLabel = () => {
    if (!genero) return "Seleccionar género";
    const opcion = OPCIONES_GENERO.find(o => o.value === genero);
    return opcion?.label || genero;
  };

  const handleSave = async () => {
    try {
      if (!nombre.trim()) {
        Alert.alert("Error", "El nombre es obligatorio");
        return;
      }

      const numericFields = [
        { value: altura, name: "altura", max: 300 },
        { value: peso, name: "peso", max: 500 },
        { value: porcMusculo, name: "porcentaje de músculo", max: 100 },
        { value: porcGrasa, name: "porcentaje de grasa", max: 100 }
      ];

      for (const field of numericFields) {
        if (field.value && field.value.trim()) {
          const numValue = parseFloat(field.value);
          if (isNaN(numValue) || numValue < 0 || numValue > field.max) {
            Alert.alert("Error", `El valor de ${field.name} no es válido`);
            return;
          }
        }
      }

      setLoading(true);

      const result = await guardarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : null,
        genero: genero || null,
        altura: altura.trim() ? parseFloat(altura) : null,
        peso: peso.trim() ? parseFloat(peso) : null,
        porcMusculo: porcMusculo.trim() ? parseFloat(porcMusculo) : null,
        porcGrasa: porcGrasa.trim() ? parseFloat(porcGrasa) : null,
        userIcon: userIcon || null, // NUEVO
      });

      console.log('📤 Resultado de guardar:', result);

      if (result.success) {
        Alert.alert(
          "Éxito",
          "Perfil actualizado correctamente",
          [
            {
              text: "OK",
              onPress: () => {
                setNombre("");
                setApellido("");
                setFechaNacimiento(null);
                setGenero("");
                setAltura("");
                setPeso("");
                setPorcMusculo("");
                setPorcGrasa("");
                setShowDatePicker(false);
                setShowGenderPicker(false);
                setLoading(false);
                // no limpiamos userIcon: lo mantiene
                
                setTimeout(() => {
                  router.back();
                }, 100);
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert("Error", result.message);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error guardando perfil:", error);
      Alert.alert("Error", "No se pudo guardar el perfil");
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Seleccionar fecha";

    try {
      const dayJsDate = dayjs(date);
      if (!dayJsDate.isValid()) {
        return "Fecha inválida";
      }
      return dayJsDate.format("DD/MM/YYYY");
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Seleccionar fecha";
    }
  };

  const handleDateChange = ({ date }: { date: any }) => {
    try {
      if (!date) return;

      let newDate: Date;

      if (date instanceof Date) {
        newDate = date;
      } else if (typeof date === "string" || typeof date === "number") {
        newDate = dayjs(date).toDate();
      } else if (date.toDate && typeof date.toDate === "function") {
        newDate = date.toDate();
      } else {
        console.error("Tipo de fecha no reconocido:", typeof date, date);
        return;
      }

      if (isNaN(newDate.getTime())) {
        console.error("Fecha inválida:", newDate);
        Alert.alert("Error", "Fecha seleccionada no es válida");
        return;
      }

      const minDate = dayjs().subtract(100, "years").toDate();
      const maxDate = dayjs().subtract(13, "years").toDate();

      if (newDate < minDate || newDate > maxDate) {
        Alert.alert("Error", "La fecha debe estar entre 13 y 100 años");
        return;
      }

      setFechaNacimiento(newDate);
    } catch (error) {
      console.error("Error procesando fecha:", error);
      Alert.alert("Error", "Error al seleccionar la fecha");
    }
  };

  const openIconPicker = () => {
    setSelectedIconDraft(userIcon || null);
    setShowIconPicker(true);
  };
  const cancelIconPicker = () => {
    setSelectedIconDraft(null);
    setShowIconPicker(false);
  };
  const confirmIconPicker = () => {
    setUserIcon(selectedIconDraft || null);
    setShowIconPicker(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.avatarBg}>
            {userIcon ? (
              <Image
                source={getUserIconSource(userIcon)}
                style={styles.avatar}
                contentFit="contain"
                containerStyle={{ backgroundColor: 'transparent' }}
                variant="default"
              />
            ) : (
              <User color="#FF9966" size={70} strokeWidth={2} />
            )}
          </View>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>
            {usuario?.email || "Actualiza tu información personal"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          {/* NUEVO: Icono de perfil */}
          <LabeledField label="Icono de perfil">
            <Pressable
              style={[styles.inputRow, styles.inputEspecial]}
              onPress={() => !loading && openIconPicker()}
              disabled={loading}
            >
              <View style={styles.iconPreviewCircle}>
                {userIcon ? (
                  <Image
                    source={getUserIconSource(userIcon)}
                    width={24}
                    height={24}
                    contentFit="contain"
                    containerStyle={{ backgroundColor: 'transparent' }}
                    variant="default"
                  />
                ) : (
                  <User color="#FF9966" size={18} strokeWidth={2} />
                )}
              </View>
              <Text style={[styles.input, { color: "#8B5A2B" }]}>
                {userIcon ? `Seleccionado: ${userIcon}` : "Seleccionar icono"}
              </Text>
              <ChevronDown color="#FF9966" size={20} />
            </Pressable>
          </LabeledField>

          <LabeledField label="Nombre">
            <View style={styles.inputRow}>
              <User color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Nombre (obligatorio)"
                placeholderTextColor="#A0522D"
                value={normalizarCaseString(nombre)}
                onChangeText={setNombre}
                autoCapitalize="words"
                editable={!loading}
                maxLength={50}
              />
            </View>
          </LabeledField>

          <LabeledField label="Apellido">
            <View style={styles.inputRow}>
              <User color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor="#A0522D"
                value={normalizarCaseString(apellido)}
                onChangeText={setApellido}
                autoCapitalize="words"
                editable={!loading}
                maxLength={50}
              />
            </View>
          </LabeledField>

          <LabeledField label="Fecha de Nacimiento">
            <Pressable
              style={[styles.inputRow, styles.inputEspecial]}
              onPress={() => !loading && setShowDatePicker(true)}
              disabled={loading}
            >
              <Calendar color="#FF9966" size={20} strokeWidth={2} />
              <Text
                style={[
                  styles.input,
                  { color: fechaNacimiento ? "#8B5A2B" : "#A0522D" },
                ]}
              >
                {formatDate(fechaNacimiento)}
              </Text>
              <ChevronDown color="#FF9966" size={20} />
            </Pressable>
          </LabeledField>

          <LabeledField label="Género">
            <Pressable
              style={[styles.inputRow, styles.inputEspecial]}
              onPress={() => !loading && setShowGenderPicker(true)}
              disabled={loading}
            >
              <User color="#FF9966" size={20} strokeWidth={2} />
              <Text
                style={[
                  styles.input,
                  { color: genero ? "#8B5A2B" : "#A0522D" },
                ]}
              >
                {getGenderLabel()}
              </Text>
              <ChevronDown color="#FF9966" size={20} />
            </Pressable>
          </LabeledField>

          <Text style={styles.sectionTitle}>Datos físicos</Text>

          <LabeledField label="Altura (cm)">
            <View style={styles.inputRow}>
              <Ruler color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Altura (cm)"
                placeholderTextColor="#A0522D"
                value={altura}
                onChangeText={(value) => handleNumericInput(value, setAltura)}
                keyboardType="numeric"
                editable={!loading}
                maxLength={5}
              />
            </View>
          </LabeledField>

          <LabeledField label="Peso (kg)">
            <View style={styles.inputRow}>
              <Weight color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Peso (kg)"
                placeholderTextColor="#A0522D"
                value={peso}
                onChangeText={(value) => handleNumericInput(value, setPeso)}
                keyboardType="numeric"
                editable={!loading}
                maxLength={5}
              />
            </View>
          </LabeledField>

          <LabeledField label="% Músculo">
            <View style={styles.inputRow}>
              <Dumbbell color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="% Músculo"
                placeholderTextColor="#A0522D"
                value={porcMusculo}
                onChangeText={(value) => handleNumericInput(value, setPorcMusculo)}
                keyboardType="numeric"
                editable={!loading}
                maxLength={5}
              />
            </View>
          </LabeledField>

          <LabeledField label="% Grasa">
            <View style={styles.inputRow}>
              <Percent color="#FF9966" size={20} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="% Grasa"
                placeholderTextColor="#A0522D"
                value={porcGrasa}
                onChangeText={(value) => handleNumericInput(value, setPorcGrasa)}
                keyboardType="numeric"
                editable={!loading}
                maxLength={5}
              />
            </View>
          </LabeledField>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => !loading && router.back()}
              disabled={loading}
            >
              <X color="#8B5A2B" size={20} strokeWidth={2} />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.saveButton,
                { opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Save color="#FFF" size={20} strokeWidth={2} />
              )}
              <Text style={styles.saveButtonText}>
                {loading ? "Guardando..." : "Guardar"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Modal selector de iconos */}
        <Modal
          visible={showIconPicker}
          transparent
          animationType="fade"
          onRequestClose={() => !loading && cancelIconPicker()}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Elegir icono de perfil</Text>
                <Pressable
                  onPress={() => !loading && cancelIconPicker()}
                  style={styles.closeButton}
                  disabled={loading}
                >
                  <X color="#8B5A2B" size={24} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={styles.iconsGrid}>
                {USER_ICONS.map((it) => {
                  const selected = selectedIconDraft === it.key;
                  return (
                    <Pressable
                      key={it.key}
                      style={[styles.iconOption, selected && styles.iconOptionSelected]}
                      onPress={() => setSelectedIconDraft(it.key)}
                      disabled={loading}
                    >
                      <Image
                        source={it.source}
                        width={56}
                        height={56}
                        contentFit="cover"
                        style={{ borderRadius: 28 }}
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { marginTop: 8 },
                          selected && styles.pickerOptionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {it.key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.datePickerActions}>
                <Pressable
                  style={[styles.datePickerButton, styles.datePickerCancelButton]}
                  onPress={() => !loading && cancelIconPicker()}
                  disabled={loading}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.datePickerButton, styles.datePickerSaveButton]}
                  onPress={() => !loading && confirmIconPicker()}
                  disabled={loading}
                >
                  <Text style={styles.datePickerSaveButtonText}>Usar icono</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showGenderPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !loading && setShowGenderPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Seleccionar género</Text>
                <Pressable
                  onPress={() => !loading && setShowGenderPicker(false)}
                  style={styles.closeButton}
                  disabled={loading}
                >
                  <X color="#8B5A2B" size={24} strokeWidth={2} />
                </Pressable>
              </View>

              {OPCIONES_GENERO.map((opcion) => (
                <Pressable
                  key={opcion.value}
                  style={[
                    styles.pickerOption,
                    genero === opcion.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setGenero(opcion.value);
                    setShowGenderPicker(false);
                  }}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      genero === opcion.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opcion.label}
                  </Text>
                  {genero === opcion.value && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !loading && setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>
                  Seleccionar fecha de nacimiento
                </Text>
                <Pressable
                  onPress={() => !loading && setShowDatePicker(false)}
                  style={styles.closeButton}
                  disabled={loading}
                >
                  <X color="#8B5A2B" size={24} strokeWidth={2} />
                </Pressable>
              </View>

              <DateTimePicker
                mode="single"
                date={fechaNacimiento || undefined}
                locale="es"
                firstDayOfWeek={1}
                onChange={handleDateChange}
                styles={{
                  // tamaño y centrado del día
                  day_cell: {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  // texto del día
                  day_label: {
                    color: "#8B5A2B",
                    fontWeight: "600",
                  },
                  // círculo del día seleccionado (keys correctas)
                  selected: {
                    backgroundColor: "#FF9966",
                    borderRadius: 999,
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  selected_label: {
                    color: "#FFF",
                    fontWeight: "bold",
                  },
                  // estilo para "hoy"
                  today: {
                    backgroundColor: "#FF9966",
                    borderRadius: 999,
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  today_label: {
                    color: "#FF9966",
                    fontWeight: "700",
                  },
                }}
              />

              <View style={styles.datePickerActions}>
                <Pressable
                  style={[styles.datePickerButton, styles.datePickerCancelButton]}
                  onPress={() => !loading && setShowDatePicker(false)}
                  disabled={loading}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancelar</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.datePickerButton, styles.datePickerSaveButton]}
                  onPress={() => !loading && setShowDatePicker(false)}
                  disabled={loading || !fechaNacimiento}
                >
                  <Text style={styles.datePickerSaveButtonText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
  },
  inner: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFE5CC", // fondo sólido de la paleta
    alignItems: "center",
    justifyContent: "center",
    padding: 10, // margen para que el icono no toque el borde
  },
    avatar: {
    width: 110,
    height: 110,
    // sin recorte ni borde
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
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
    textAlign: "center",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5A2B",
    marginTop: 16,
    marginBottom: 12,
  },
  field: {
    marginBottom: 10,
  },
  inputLabel: {
    color: "#A0522D",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
    opacity: 0.9,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E6",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFE5CC",
  },
  input: {
    flex: 1,
    color: "#8B5A2B",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  inputEspecial: {
    paddingVertical: 9,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#FFE5CC",
    borderWidth: 1,
    borderColor: "#FFD2B3",
  },
  saveButton: {
    backgroundColor: "#FF9966",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: "#8B5A2B",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5A2B",
    flex: 1,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF5E6",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE5CC",
  },
  pickerOptionSelected: {
    backgroundColor: "#FF9966",
    borderColor: "#FF9966",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#8B5A2B",
    fontWeight: "500",
  },
  pickerOptionTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FF9966",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5A2B",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFE5CC",
  },
  datePickerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#FFE5CC",
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  datePickerCancelButton: {
    backgroundColor: "#FFE5CC",
  },
  datePickerSaveButton: {
    backgroundColor: "#FF9966",
  },
  datePickerCancelButtonText: {
    color: "#8B5A2B",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerSaveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconPreviewCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFE5CC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  iconOption: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#FFE5CC",
  },
  iconOptionSelected: {
    borderColor: "#FF9966",
    backgroundColor: "#e37037ff",
  },
});
