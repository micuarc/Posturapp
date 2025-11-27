import { NativeModules, Platform } from "react-native";

const Postura =
  Platform.OS === "android"
    ? NativeModules.Postura
    : null;

const SensorService =
  Platform.OS === "android"
    ? NativeModules.SensorService
    : null;

export const setEsp32Ip = (ip: string) => {
  if (!Postura) return;
  Postura.setEsp32Ip?.(ip);
};

export const startService = () => {
  if (!Postura) return;
  Postura.startService?.();
};

export const stopService = () => {
  if (!Postura) return;
  Postura.stopService?.();
};

export const setFeedbackConfig = (v: boolean, n: boolean, s: boolean) => {
  if (SensorService && SensorService.setFeedbackConfig) {
    SensorService.setFeedbackConfig(v, n, s);
    return;
  }
  if (!Postura) return;
  Postura.setFeedbackConfig?.(v, n, s);
};

export const vibrate = () => {
  if (!Postura) return;
  Postura.vibrate?.();
};
