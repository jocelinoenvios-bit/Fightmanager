import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Button, Card, Chip, EmptyState, FAB, Input, Screen, ScreenHeader, SelectField, StatCard } from '@/components';
import { financeService } from '@/services/finance';
import { studentsService } from '@/services/students';
import { DESPESA_CATEGORIAS, FinanceEntry, FinanceType, Student } from '@/types';
import { formatCurrency, todayIso } from '@/utils/format';

const RECEITA_CATEGORIAS = ['Mensalidades', 'Matrículas', 'Produtos', 'Eventos', 'Outros'];

// Categorias de despesa que se repetem todo mês independente do faturamento
// (aluguel, contas, folha), usadas para prever o custo fixo do mês seguinte.
const CATEGORIAS_CUSTO_FIXO = ['Aluguel', 'Energia', 'Água', 'Internet', 'Salários'];

export default function FinanceiroScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<FinanceType | 'Todos'>('Todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [list, studentList] = await Promise.all([
      financeService(academiaId).list(),
      studentsService(academiaId).list(),
    ]);
    setEntries(list.sort((a, b) => b.data.localeCompare(a.data)));
    setStudents(studentList);
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const currentMonth = todayIso().slice(0, 7);
  const receitasMes = entries.filter((e) => e.tipo === 'Receita' && e.data.startsWith(currentMonth)).reduce((s, e) => s + e.valor, 0);
  const despesasMes = entries.filter((e) => e.tipo === 'Despesa' && e.data.startsWith(currentMonth)).reduce((s, e) => s + e.valor, 0);
  const lucroMes = receitasMes - despesasMes;

  const currentYear = todayIso().slice(0, 4);
  const receitasAno = entries.filter((e) => e.tipo === 'Receita' && e.data.startsWith(currentYear)).reduce((s, e) => s + e.valor, 0);
  const despesasAno = entries.filter((e) => e.tipo === 'Despesa' && e.data.startsWith(currentYear)).reduce((s, e) => s + e.valor, 0);

  const filtered = filter === 'Todos' ? entries : entries.filter((e) => e.tipo === filter);

  const chart = useMemo(() => buildLast6MonthsProfit(entries), [entries]);

  const receitaPrevistaProximoMes = useMemo(
    () => students.filter((s) => s.status === 'Ativo').reduce((sum, s) => sum + (s.valorMensalidade || 0), 0),
    [students]
  );
  const custosFixosPrevistos = useMemo(() => averageFixedCosts(entries), [entries]);
  const liquidoPrevistoProximoMes = receitaPrevistaProximoMes - custosFixosPrevistos;

  const handleDelete = (entry: FinanceEntry) => {
    Alert.alert('Excluir lançamento', 'Deseja excluir este lançamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!academiaId) return;
          await financeService(academiaId).remove(entry.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Financeiro" subtitle="Receitas e despesas" onBack={() => router.back()} />

      <View style={styles.statsGrid}>
        <StatCard label="Lucro do mês" value={formatCurrency(lucroMes)} icon="trending-up" tone={lucroMes >= 0 ? 'success' : 'danger'} />
        <StatCard label="Receitas do ano" value={formatCurrency(receitasAno)} icon="arrow-up-circle" tone="primary" />
        <StatCard label="Despesas do ano" value={formatCurrency(despesasAno)} icon="arrow-down-circle" tone="warning" />
        <StatCard label="Fluxo (ano)" value={formatCurrency(receitasAno - despesasAno)} icon="analytics" tone="primary" />
        <StatCard
          label="Previsão líquida (mês seguinte)"
          value={formatCurrency(liquidoPrevistoProximoMes)}
          icon="calendar-outline"
          tone={liquidoPrevistoProximoMes >= 0 ? 'success' : 'danger'}
          hint={`Receita prevista ${formatCurrency(receitaPrevistaProximoMes)} · Custos fixos ${formatCurrency(custosFixosPrevistos)}`}
        />
      </View>

      <Card style={{ alignItems: 'center', marginBottom: 16 }}>
        {chart.values.some((v) => v !== 0) ? (
          <LineChart
            data={{ labels: chart.labels, datasets: [{ data: chart.values }] }}
            width={Dimensions.get('window').width - 72}
            height={180}
            withInnerLines={false}
            yAxisLabel="R$"
            yAxisSuffix=""
            formatYLabel={(v) => Number(v).toFixed(0)}
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: () => colors.success,
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '4', fill: colors.success },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        ) : (
          <EmptyState icon="bar-chart-outline" title="Sem dados suficientes" />
        )}
      </Card>

      <View style={styles.filters}>
        {(['Todos', 'Receita', 'Despesa'] as const).map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <EmptyState icon="wallet-outline" title="Nenhum lançamento" /> : null}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{item.categoria}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.data.split('-').reverse().join('/')}</Text>
              {!!item.descricao && <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.descricao}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: item.tipo === 'Receita' ? colors.success : colors.danger, fontWeight: '700' }}>
                {item.tipo === 'Receita' ? '+' : '-'} {formatCurrency(item.valor)}
              </Text>
              <Badge label={item.tipo} tone={item.tipo === 'Receita' ? 'success' : 'danger'} />
            </View>
            <Pressable onPress={() => handleDelete(item)} style={{ marginLeft: 10 }}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </Card>
        )}
      />

      <FAB onPress={() => setModalVisible(true)} />

      <AddFinanceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          load();
        }}
      />
    </Screen>
  );
}

function AddFinanceModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors, radius } = useTheme();
  const { academiaId } = useAuth();
  const [tipo, setTipo] = useState<FinanceType>('Despesa');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(todayIso());
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categorias = tipo === 'Despesa' ? DESPESA_CATEGORIAS : RECEITA_CATEGORIAS;

  const handleSave = async () => {
    setError('');
    if (!categoria || !valor || Number.isNaN(Number(valor)) || !academiaId) {
      setError('Preencha categoria e valor corretamente.');
      return;
    }
    setSaving(true);
    try {
      await financeService(academiaId).create({
        academiaId,
        tipo,
        categoria,
        valor: Number(valor),
        data,
        descricao,
        createdAt: Date.now(),
      });
      setCategoria('');
      setValor('');
      setDescricao('');
      onSaved();
    } catch {
      setError('Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Novo lançamento</Text>
          <View style={styles.typeRow}>
            <Chip label="Despesa" selected={tipo === 'Despesa'} onPress={() => setTipo('Despesa')} />
            <Chip label="Receita" selected={tipo === 'Receita'} onPress={() => setTipo('Receita')} />
          </View>
          <SelectField label="Categoria" value={categoria} options={categorias} onChange={setCategoria} placeholder="Selecionar categoria" />
          <Input label="Valor (R$)" value={valor} onChangeText={setValor} keyboardType="numeric" />
          <Input label="Data" value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />
          <Input label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}
          <Button label="Salvar lançamento" onPress={handleSave} loading={saving} fullWidth size="lg" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function buildLast6MonthsProfit(entries: FinanceEntry[]) {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    });
  }
  const values = months.map(({ key }) => {
    const receitas = entries.filter((e) => e.tipo === 'Receita' && e.data.startsWith(key)).reduce((s, e) => s + e.valor, 0);
    const despesas = entries.filter((e) => e.tipo === 'Despesa' && e.data.startsWith(key)).reduce((s, e) => s + e.valor, 0);
    return receitas - despesas;
  });
  return { labels: months.map((m) => m.label), values };
}

// Média das despesas fixas (aluguel, contas, salários...) dos últimos meses com
// lançamento, usada como estimativa desses custos para o mês seguinte. Sem
// histórico, usa o mês corrente como aproximação.
function averageFixedCosts(entries: FinanceEntry[], monthsBack = 3): number {
  const now = new Date();
  const monthTotals: number[] = [];
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = entries
      .filter((e) => e.tipo === 'Despesa' && CATEGORIAS_CUSTO_FIXO.includes(e.categoria) && e.data.startsWith(key))
      .reduce((s, e) => s + e.valor, 0);
    if (total > 0) monthTotals.push(total);
  }
  if (monthTotals.length > 0) {
    return monthTotals.reduce((s, v) => s + v, 0) / monthTotals.length;
  }
  const currentMonth = todayIso().slice(0, 7);
  return entries
    .filter((e) => e.tipo === 'Despesa' && CATEGORIAS_CUSTO_FIXO.includes(e.categoria) && e.data.startsWith(currentMonth))
    .reduce((s, e) => s + e.valor, 0);
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 4 },
});
