import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, EmptyState, FAB, Screen, ScreenHeader } from '@/components';
import { classesService } from '@/services/classes';
import { ClassSession } from '@/types';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const list = await classesService(academiaId).list();
    setClasses(list.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)));
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (turma: ClassSession) => {
    Alert.alert('Excluir turma', `Excluir a turma "${turma.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!academiaId) return;
          await classesService(academiaId).remove(turma.id);
          load();
        },
      },
    ]);
  };

  const dayClasses = classes.filter((c) => c.diasSemana.includes(selectedDay));

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Agenda" subtitle={`${classes.length} turmas cadastradas`} onBack={() => router.back()} />

      <View style={styles.daysRow}>
        {DIAS.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => setSelectedDay(index)}
            style={[
              styles.dayPill,
              {
                backgroundColor: selectedDay === index ? colors.primary : colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: selectedDay === index ? colors.onPrimary : colors.text, fontWeight: '700', fontSize: 12 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {dayClasses.length === 0 ? (
          <EmptyState icon="calendar-outline" title="Nenhuma turma neste dia" />
        ) : (
          dayClasses.map((turma) => (
            <Card key={turma.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{turma.nome}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 2 }}>
                  {turma.horarioInicio} - {turma.horarioFim} {turma.professorNome ? `· Prof. ${turma.professorNome}` : ''}
                </Text>
                {!!turma.limiteAlunos && (
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Limite: {turma.limiteAlunos} alunos</Text>
                )}
              </View>
              <Badge label={turma.modalidade} tone="primary" />
              <Pressable onPress={() => router.push(`/agenda/form?id=${turma.id}`)} style={{ marginLeft: 10 }}>
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(turma)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => router.push('/agenda/form')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  dayPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
});
