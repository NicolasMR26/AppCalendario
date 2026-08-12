import { Alert, Platform } from "react-native";

/**
 * `Alert.alert`'s button/onPress callbacks silently never fire on web via
 * react-native-web, so anything relying on them (a dismiss action, a
 * destructive confirm) would just do nothing there. These two helpers give
 * every platform a working equivalent.
 */

export function notify(title: string, message: string, onDismiss?: () => void): void {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    onDismiss?.();
    return;
  }
  Alert.alert(title, message, [{ text: "OK", onPress: onDismiss }]);
}

export function confirmDestructive(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
