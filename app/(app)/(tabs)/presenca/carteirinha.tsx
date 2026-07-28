import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Avatar, Card, Screen, ScreenHeader, SelectField } from '@/components';
import { studentsService } from '@/services/students';
import { Student } from '@/types';

export default function CarteirinhaScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { academia } = useAcademia();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string | undefined>();

  useEffect(() => {
    if (!academiaId) return;
    studentsService(academiaId)
      .list()
      .then((list) => setStudents(list.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))));
  }, [academiaId]);

  const student = students.find((s) => s.id === studentId);
  const qrValue = student && academiaId ? `fightmanager:student:${academiaId}:${student.id}` : '';

  return (
    <Screen>
      <ScreenHeader title="Carteirinha QR Code" onBack={() => router.back()} />
      <SelectField
        label="Aluno"
        value={student?.nomeCompleto}
        options={students.map((s) => s.nomeCompleto)}
        onChange={(nome) => setStudentId(students.find((s) => s.nomeCompleto === nome)?.id)}
        placeholder="Selecionar aluno"
      />

      {student && (
        <Card style={styles.card}>
          <Avatar uri={student.fotoUrl} name={student.nomeCompleto} size={64} />
          <Text style={[styles.name, { color: colors.text }]}>{student.nomeCompleto}</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{academia?.nome}</Text>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={220} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            Apresente este código na catraca ou peça para o professor escanear ao chegar na aula.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', marginTop: 12 },
  name: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  qrWrap: { padding: 16, backgroundColor: '#fff', borderRadius: 16 },
});
