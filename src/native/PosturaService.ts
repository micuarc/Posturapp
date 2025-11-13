// src/native/PosturaService.ts
import { NativeModules, Platform } from "react-native";

const NativePostura = Platform.OS === "android" ? NativeModules.Postura : null;

export const PosturaService = {
  start: () => {
    if (!NativePostura) return;
    try {
      NativePostura.startService();
    } catch (e) {
      console.log("Error startService:", e);
    }
  },

  stop: () => {
    if (!NativePostura) return;
    try {
      NativePostura.stopService();
    } catch (e) {
      console.log("Error stopService:", e);
    }
  },

  vibrate: () => {
    if (!NativePostura) return;
    try {
      NativePostura.vibrate();
    } catch (e) {
      console.log("Error vibrate:", e);
    }
  },

  notify: (title: string, message: string) => {
    if (!NativePostura) return;
    try {
      NativePostura.notify(title, message);
    } catch (e) {
      console.log("Error notify:", e);
    }
  },

  setThresholds: (badSeconds: number, cooldownSeconds: number) => {
    if (!NativePostura) return;
    try {
      NativePostura.setThresholds(badSeconds, cooldownSeconds);
    } catch (e) {
      console.log("Error setThresholds:", e);
    }
  },

  openOverlaySettings: () => {
    if (!NativePostura) return;
    try {
      NativePostura.openOverlaySettings();
    } catch (e) {
      console.log("Error openOverlaySettings:", e);
    }
  },
};
