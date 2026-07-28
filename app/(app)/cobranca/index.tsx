import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Badge, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { paymentsService } from '@/services/payments';
import { studentsService } from '@/services/students';
import { Payment, Student } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { computeStatus } from '@/utils/payments';
import { buildCobrancaMessage, openWhatsapp } from '@/utils/whatsapp';

export default function CobrancaScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { academia } = useAcademia();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [p, s] = await Promise.all([paymentsService(academiaId).list(), studentsService(academiaId).list()]);
    const pendentes = p
      .map((item) => ({ ...item, status: computeStatus(item) }))
      .filter((item) => item.status !== 'Pago')
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    setPayments(pendentes);
    setStudents(s);
    setLoading(false);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const studentPhone = (studentId: string) => {
    const s = students.find((st) => st.id === studentId);
    return s?.whatsapp || s?.telefone;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(payments.map((p) => p.id)));
  };

  const startBatch = () => {
    const items = payments.filter((p) => selected.has(p.id) && studentPhone(p.studentId));
    if (items.length === 0) return;
    setQueue(items);
  };

  const sendNext = () => {
    if (queue.length === 0) return;
    const [current, ...rest] = queue;
    const phone = studentPhone(current.studentId);
    if (phone) {
      openWhatsapp(phone, buildCobrancaMessage(current, academia?.nome ?? 'nossa academia'));
    }
    setQueue(rest);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(current.id);
      return next;
    });
  };

  const totalPendente = payments.reduce((s, p) => s + p.valor, 0);

  if (queue.length > 0) {
    const current = queue[0];
    return (
      <Screen>
        <ScreenHeader title="Envio em lote" onBack={() => setQueue([])} />
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name="logo-whatsapp" size={40} color={colors.success} />
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{current.studentNome}</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            {buildCobrancaMessage(current, academia?.nome ?? 'nossa academia')}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>Restam {queue.length} cobranças na fila</Text>
        </Card>
        <Button
          label="Abrir WhatsApp e enviar"
          icon="logo-whatsapp"
          fullWidth
          size="lg"
          onPress={sendNext}
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Cobrança WhatsApp" subtitle={`${payments.length} pendências · ${formatCurrency(totalPendente)}`} onBack={() => router.back()} />

      <View style={styles.actionsRow}>
        <Button label="Selecionar todos" size="sm" variant="outline" onPress={selectAll} />
        <Button label={`Enviar selecionados (${selected.size})`} size="sm" icon="logo-whatsapp" onPress={startBatch} />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <EmptyState icon="checkmark-done-circle-outline" title="Nenhuma pendência" message="Todos os alunos estão em dia." /> : null}
        renderItem={({ item }) => {
          const phone = studentPhone(item.studentId);
          const isSelected = selected.has(item.id);
          return (
            <Pressable onPress={() => toggleSelect(item.id)}>
              <Card style={[styles.row, isSelected && { borderColor: colors.primary, borderWidth: 1.5 }]}>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{item.studentNome}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                    Venc. {formatDate(item.vencimento)} · {formatCurrency(item.valor)}
                  </Text>
                  {!phone && <Text style={{ color: colors.danger, fontSize: 11 }}>Sem WhatsApp cadastrado</Text>}
                </View>
                <Badge label={item.status} tone={item.status === 'Vencido' ? 'danger' : 'warning'} />
                <Pressable
                  onPress={() => phone && openWhatsapp(phone, buildCobrancaMessage(item, academia?.nome ?? 'nossa academia'))}
                  style={{ marginLeft: 10 }}
                  disabled={!phone}
                >
                  <Ionicons name="logo-whatsapp" size={22} color={phone ? colors.success : colors.textMuted} />
                </Pressable>
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
});
