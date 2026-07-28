import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge, Card, EmptyState, FAB, Screen, ScreenHeader } from '@/components';
import { teachersService } from '@/services/teachers';
import { Teacher } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function ProfessoresScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const list = await teachersService(academiaId).list();
    setTeachers(list.sort((a, b) => a.nome.localeCompare(b.nome)));
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (teacher: Teacher) => {
    Alert.alert('Excluir professor', `Excluir "${teacher.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!academiaId) return;
          await teachersService(academiaId).remove(teacher.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Professores" subtitle={`${teachers.length} cadastrados`} onBack={() => router.back()} />
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <EmptyState icon="school-outline" title="Nenhum professor cadastrado" /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Avatar uri={item.fotoUrl} name={item.nome} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{item.nome}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{item.especialidade}</Text>
              {!!item.salario && (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatCurrency(item.salario)}/mês</Text>
              )}
            </View>
            <Pressable onPress={() => router.push(`/professores/form?id=${item.id}`)} style={{ marginRight: 6 }}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Card>
        )}
      />
      <FAB onPress={() => router.push('/professores/form')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
});
