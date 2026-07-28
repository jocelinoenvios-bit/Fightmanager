import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Badge, Card, EmptyState, FAB, Input, ScreenHeader, Chip } from '@/components';
import { Screen } from '@/components';
import { studentsService } from '@/services/students';
import { Student, StudentStatus } from '@/types';
import { formatCurrency } from '@/utils/format';

const STATUS_FILTERS: (StudentStatus | 'Todos')[] = ['Todos', 'Ativo', 'Inativo', 'Trancado'];

export default function AlunosListScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'Todos'>('Todos');

  const load = useCallback(async () => {
    if (!academiaId) return;
    const list = await studentsService(academiaId).list();
    setStudents(list.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
      const matchSearch = s.nomeCompleto.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [students, search, statusFilter]);

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Alunos" subtitle={`${students.length} cadastrados`} />
      <View style={styles.searchWrap}>
        <Input placeholder="Buscar aluno" icon="search-outline" value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.filters}>
        {STATUS_FILTERS.map((s) => (
          <Chip key={s} label={s} selected={statusFilter === s} onPress={() => setStatusFilter(s)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title="Nenhum aluno encontrado"
              message="Cadastre o primeiro aluno da academia."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/alunos/${item.id}`)}>
            <Card style={styles.card}>
              <Avatar uri={item.fotoUrl} name={item.nomeCompleto} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {item.nomeCompleto}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                  {item.modalidade}
                  {item.faixa ? ` · Faixa ${item.faixa}` : ''}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {formatCurrency(item.valorMensalidade)} · vence dia {item.diaVencimento}
                </Text>
              </View>
              <Badge
                label={item.status}
                tone={item.status === 'Ativo' ? 'success' : item.status === 'Trancado' ? 'warning' : 'neutral'}
              />
            </Card>
          </Pressable>
        )}
      />

      <FAB onPress={() => router.push('/alunos/form')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
});
