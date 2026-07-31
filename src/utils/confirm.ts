import { Alert, Platform } from 'react-native';

// RN's Alert.alert() buttons/onPress don't work on web (Chrome, etc.) — the
// dialog never fires the callback there, so a web build needs window.confirm instead.
export function confirmAction(title: string, message: string, confirmLabel = 'Confirmar'): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
