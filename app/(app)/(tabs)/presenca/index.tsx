import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge, Button, Card, EmptyState, Screen, ScreenHeader, StatCard } from '@/components';
import { attendanceService } from '@/services/attendance';
import { studentsService } from '@/services/students';
import { AttendanceRecord, Student } from '@/types';
import { todayIso } from '@/utils/format';

export default function PresencaScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [s, a] = await Promise.all([studentsService(academiaId).list(), attendanceService(academiaId).list()]);
    setStudents(s.filter((st) => st.status === 'Ativo').sort((x, y) => x.nomeCompleto.localeCompare(y.nomeCompleto)));
    setAttendance(a);
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = todayIso();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const presentesHoje = attendance.filter((a) => a.data === today);
  const presentesSemana = new Set(attendance.filter((a) => a.data >= weekAgo).map((a) => a.studentId)).size;
  const presentesMes = new Set(attendance.filter((a) => a.data >= monthAgo).map((a) => a.studentId)).size;

  const baixaFrequencia = useMemo(() => {
    const countByStudent = new Map<string, number>();
    attendance
      .filter((a) => a.data >= monthAgo)
      .forEach((a) => countByStudent.set(a.studentId, (countByStudent.get(a.studentId) ?? 0) + 1));
    return students.filter((s) => (countByStudent.get(s.id) ?? 0) < 4);
  }, [students, attendance, monthAgo]);

  const checkedInIds = new Set(presentesHoje.map((a) => a.studentId));

  const handleCheckIn = async (student: Student) => {
    if (!academiaId || checkedInIds.has(student.id)) return;
    const now = new Date();
    await attendanceService(academiaId).create({
      academiaId,
      studentId: student.id,
      studentNome: student.nomeCompleto,
      data: today,
      horario: now.toTimeString().slice(0, 5),
      metodo: 'Manual',
      createdAt: Date.now(),
    });
    load();
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader
        title="Presença"
        subtitle={`${presentesHoje.length} check-ins hoje`}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Carteirinha" icon="id-card-outline" size="sm" variant="outline" onPress={() => router.push('/presenca/carteirinha')} />
            <Button label="Ler QR" icon="qr-code-outline" size="sm" onPress={() => router.push('/presenca/qrcode')} />
          </View>
        }
      />

      <View style={styles.statsRow}>
        <StatCard label="Presentes semana" value={String(presentesSemana)} icon="calendar-outline" tone="primary" />
        <StatCard label="Presentes mês" value={String(presentesMes)} icon="calendar" tone="success" />
      </View>

      {!showPicker ? (
        <Button
          label="Check-in manual"
          icon="add-circle-outline"
          fullWidth
          size="lg"
          onPress={() => setShowPicker(true)}
          style={{ marginBottom: 16 }}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          style={{ marginBottom: 16, maxHeight: 320 }}
          ListHeaderComponent={
            <Text style={[styles.pickerTitle, { color: colors.textSecondary }]}>Toque para registrar presença</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => handleCheckIn(item)} disabled={checkedInIds.has(item.id)}>
              <Card style={styles.studentRow}>
                <Avatar uri={item.fotoUrl} name={item.nomeCompleto} size={36} />
                <Text style={{ color: colors.text, flex: 1, marginLeft: 10 }}>{item.nomeCompleto}</Text>
                {checkedInIds.has(item.id) ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                ) : (
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                )}
              </Card>
            </Pressable>
          )}
        />
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Presentes hoje</Text>
      <FlatList
        data={presentesHoje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={!loading ? <EmptyState icon="body-outline" title="Ninguém fez check-in ainda" /> : null}
        renderItem={({ item }) => (
          <Card style={styles.studentRow}>
            <Text style={{ color: colors.text, flex: 1 }}>{item.studentNome}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{item.horario}</Text>
            <Badge label={item.metodo} tone="neutral" />
          </Card>
        )}
      />

      {baixaFrequencia.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Baixa frequência (30 dias)</Text>
          {baixaFrequencia.slice(0, 5).map((s) => (
            <Card key={s.id} style={styles.studentRow}>
              <Text style={{ color: colors.text, flex: 1 }}>{s.nomeCompleto}</Text>
              <Badge label="Atenção" tone="warning" />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pickerTitle: { fontSize: 12, marginBottom: 8 },
  studentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4 },
});
