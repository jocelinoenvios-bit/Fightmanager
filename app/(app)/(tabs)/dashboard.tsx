import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Screen, ScreenHeader, StatCard, Card, EmptyState, Avatar } from '@/components';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { attendanceService } from '@/services/attendance';
import { classesService } from '@/services/classes';
import { noticesService } from '@/services/notices';
import { Student, Payment, AttendanceRecord, ClassSession, Notice } from '@/types';
import { formatCurrency, todayIso } from '@/utils/format';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { profile, academiaId } = useAuth();
  const { academia } = useAcademia();

  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [s, p, a, c, n] = await Promise.all([
      studentsService(academiaId).list(),
      paymentsService(academiaId).list(),
      attendanceService(academiaId).list(),
      classesService(academiaId).list(),
      noticesService(academiaId).list(),
    ]);
    setStudents(s);
    setPayments(p);
    setAttendance(a);
    setClasses(c);
    setNotices(n.sort((x, y) => y.createdAt - x.createdAt));
  }, [academiaId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const today = todayIso();
  const currentMonth = today.slice(0, 7);
  const weekday = new Date().getDay();

  const alunosAtivos = students.filter((s) => s.status === 'Ativo').length;
  const previsaoFaturamento = students
    .filter((s) => s.status === 'Ativo')
    .reduce((sum, s) => sum + (s.valorMensalidade || 0), 0);
  const inadimplentes = new Set(
    payments.filter((p) => p.status !== 'Pago' && p.vencimento < today).map((p) => p.studentId)
  ).size;
  const recebidoMes = payments
    .filter((p) => p.status === 'Pago' && p.dataPagamento?.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.valor, 0);
  const pendenteReceber = payments
    .filter((p) => p.status !== 'Pago')
    .reduce((sum, p) => sum + p.valor, 0);
  const aulasHoje = classes.filter((c) => c.diasSemana.includes(weekday)).length;
  const presentesHoje = new Set(attendance.filter((a) => a.data === today).map((a) => a.studentId)).size;

  const chartData = buildLast6MonthsRevenue(payments);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader
        title={`Olá, ${profile?.nome?.split(' ')[0] ?? ''}`}
        subtitle={academia?.nome ?? 'FightManager'}
        right={<Avatar name={profile?.nome ?? '?'} uri={profile?.fotoUrl} size={40} />}
      />

      <View style={styles.grid}>
        <StatCard label="Alunos ativos" value={String(alunosAtivos)} icon="people" tone="primary" />
        <StatCard label="Previsão do mês" value={formatCurrency(previsaoFaturamento)} icon="calculator" tone="primary" />
        <StatCard label="Inadimplentes" value={String(inadimplentes)} icon="alert-circle" tone="danger" />
        <StatCard label="Recebido no mês" value={formatCurrency(recebidoMes)} icon="trending-up" tone="success" />
        <StatCard label="Pendente a receber" value={formatCurrency(pendenteReceber)} icon="time" tone="warning" />
        <StatCard label="Aulas hoje" value={String(aulasHoje)} icon="calendar" tone="primary" />
        <StatCard label="Presentes hoje" value={String(presentesHoje)} icon="checkmark-done" tone="success" />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Faturamento mensal</Text>
      <Card style={{ paddingRight: 8, alignItems: 'center' }}>
        {chartData.values.some((v) => v > 0) ? (
          <LineChart
            data={{ labels: chartData.labels, datasets: [{ data: chartData.values }] }}
            width={Dimensions.get('window').width - 72}
            height={200}
            withInnerLines={false}
            yAxisLabel="R$"
            yAxisSuffix=""
            formatYLabel={(v) => Number(v).toFixed(0)}
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: () => colors.primary,
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '4', fill: colors.primary },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        ) : (
          <EmptyState icon="bar-chart-outline" title="Sem dados ainda" message="Registre pagamentos para ver o gráfico de faturamento." />
        )}
      </Card>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Avisos importantes</Text>
        <Ionicons name="megaphone-outline" size={18} color={colors.textSecondary} onPress={() => router.push('/configuracoes')} />
      </View>
      {notices.length === 0 ? (
        <Card>
          <EmptyState icon="megaphone-outline" title="Nenhum aviso" message="Os avisos da academia aparecerão aqui." />
        </Card>
      ) : (
        notices.slice(0, 5).map((n) => (
          <Card key={n.id} style={{ marginBottom: 10 }}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{n.titulo}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{n.mensagem}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

function buildLast6MonthsRevenue(payments: Payment[]) {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    months.push({ key, label });
  }
  const values = months.map(({ key }) =>
    payments
      .filter((p) => p.status === 'Pago' && p.dataPagamento?.startsWith(key))
      .reduce((sum, p) => sum + p.valor, 0)
  );
  return { labels: months.map((m) => m.label), values };
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeTitle: { fontSize: 15, fontWeight: '700' },
});
