import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  FAB,
  RegisterPaymentModal,
  Screen,
  ScreenHeader,
} from '@/components';
import { paymentsService } from '@/services/payments';
import { studentsService } from '@/services/students';
import { Payment, PaymentStatus, Student } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { computeStatus } from '@/utils/payments';
import { buildCobrancaMessage, openWhatsapp } from '@/utils/whatsapp';

const FILTERS: (PaymentStatus | 'Todos')[] = ['Todos', 'Pendente', 'Vencido', 'Pago'];

export default function MensalidadesScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { academia } = useAcademia();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | 'Todos'>('Todos');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [p, s] = await Promise.all([paymentsService(academiaId).list(), studentsService(academiaId).list()]);
    const withStatus = p.map((item) => ({ ...item, status: computeStatus(item) }));
    setPayments(withStatus.sort((a, b) => a.vencimento.localeCompare(b.vencimento)));
    setStudents(s);
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(
    () => (filter === 'Todos' ? payments : payments.filter((p) => p.status === filter)),
    [payments, filter]
  );

  const studentPhone = (studentId: string) => {
    const s = students.find((st) => st.id === studentId);
    return s?.whatsapp || s?.telefone;
  };

  const handleCobrar = (p: Payment) => {
    const phone = studentPhone(p.studentId);
    if (!phone) return;
    openWhatsapp(phone, buildCobrancaMessage(p, academia?.nome ?? 'nossa academia'));
  };

  const handleRecibo = async (p: Payment) => {
    const message = `Recibo de pagamento\n\nAcademia: ${academia?.nome ?? ''}\nAluno: ${p.studentNome}\nReferência: ${p.mesReferencia}\nValor: ${formatCurrency(p.valor)}\nForma de pagamento: ${p.formaPagamento ?? '-'}\nData do pagamento: ${p.dataPagamento ? formatDate(p.dataPagamento) : '-'}`;
    await Share.share({ message });
  };

  const handleConfirmPayment = async (data: { dataPagamento: string; formaPagamento: any }) => {
    if (!academiaId || !selected) return;
    await paymentsService(academiaId).update(selected.id, {
      dataPagamento: data.dataPagamento,
      formaPagamento: data.formaPagamento,
      status: 'Pago',
    });
    setSelected(null);
    load();
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Mensalidades" subtitle={`${payments.length} lançamentos`} />
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="cash-outline" title="Nenhuma mensalidade" message="Registre a primeira mensalidade." /> : null
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{item.studentNome}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 2 }}>
                  Ref. {item.mesReferencia} · Venc. {formatDate(item.vencimento)}
                </Text>
                <Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>{formatCurrency(item.valor)}</Text>
              </View>
              <Badge
                label={item.status}
                tone={item.status === 'Pago' ? 'success' : item.status === 'Vencido' ? 'danger' : 'warning'}
              />
            </View>
            <View style={styles.actionsRow}>
              {item.status !== 'Pago' ? (
                <>
                  <Button label="Registrar pagamento" size="sm" variant="outline" onPress={() => setSelected(item)} />
                  <Button label="Cobrar" size="sm" icon="logo-whatsapp" onPress={() => handleCobrar(item)} />
                </>
              ) : (
                <Button label="Emitir recibo" size="sm" icon="receipt-outline" variant="outline" onPress={() => handleRecibo(item)} />
              )}
            </View>
          </Card>
        )}
      />

      <FAB onPress={() => router.push('/mensalidades/novo')} />

      <RegisterPaymentModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirmPayment}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
