import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Screen, ScreenHeader } from '@/components';
import { studentsService } from '@/services/students';
import { attendanceService } from '@/services/attendance';
import { todayIso } from '@/utils/format';

export default function QrCheckInScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const lockRef = useRef(false);

  const handleScan = async ({ data }: { data: string }) => {
    if (lockRef.current || !academiaId) return;
    lockRef.current = true;

    const parts = data.split(':');
    const studentId = parts[0] === 'fightmanager' && parts[1] === 'student' && parts[2] === academiaId ? parts[3] : null;

    if (!studentId) {
      setFeedback({ type: 'error', message: 'QR Code inválido para esta academia.' });
      setTimeout(() => {
        lockRef.current = false;
        setFeedback(null);
      }, 2000);
      return;
    }

    const student = await studentsService(academiaId).get(studentId);
    if (!student) {
      setFeedback({ type: 'error', message: 'Aluno não encontrado.' });
    } else {
      const now = new Date();
      await attendanceService(academiaId).create({
        academiaId,
        studentId: student.id,
        studentNome: student.nomeCompleto,
        data: todayIso(),
        horario: now.toTimeString().slice(0, 5),
        metodo: 'QRCode',
        createdAt: Date.now(),
      });
      setFeedback({ type: 'success', message: `Check-in de ${student.nomeCompleto} registrado!` });
    }

    setTimeout(() => {
      lockRef.current = false;
      setFeedback(null);
    }, 2000);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Screen>
        <ScreenHeader title="Ler QR Code" onBack={() => router.back()} />
        <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
          Precisamos da sua permissão para acessar a câmera e ler o QR Code de check-in.
        </Text>
        <Button label="Permitir câmera" onPress={requestPermission} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />
      <View style={styles.overlay}>
        <ScreenHeader title="Ler QR Code" onBack={() => router.back()} />
      </View>
      <View style={styles.frame} pointerEvents="none">
        <View style={[styles.frameBox, { borderColor: colors.primary }]} />
      </View>
      {feedback && (
        <View
          style={[
            styles.feedback,
            { backgroundColor: feedback.type === 'success' ? colors.success : colors.danger },
          ]}
        >
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  frame: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frameBox: { width: 240, height: 240, borderWidth: 3, borderRadius: 24 },
  feedback: { position: 'absolute', bottom: 60, left: 20, right: 20, padding: 16, borderRadius: 12 },
  feedbackText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
