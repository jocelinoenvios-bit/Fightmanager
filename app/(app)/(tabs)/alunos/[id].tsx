import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Avatar, Badge, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { teachersService } from '@/services/teachers';
import { Payment, Student, Teacher } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { buildCobrancaMessage, openWhatsapp } from '@/utils/whatsapp';

export default function StudentDetailScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { academia } = useAcademia();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [professor, setProfessor] = useState<Teacher | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!academiaId || !id) return;
    const s = await studentsService(academiaId).get(id);
    setStudent(s);
    if (s?.professorId) {
      const t = await teachersService(academiaId).get(s.professorId);
      setProfessor(t);
    } else {
      setProfessor(null);
    }
    const allPayments = await paymentsService(academiaId).list();
    setPayments(
      allPayments
        .filter((p) => p.studentId === id)
        .sort((a, b) => b.vencimento.localeCompare(a.vencimento))
    );
    setLoading(false);
  }, [academiaId, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
    Alert.alert('Excluir aluno', 'Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!academiaId || !id) return;
          await studentsService(academiaId).remove(id);
          router.back();
        },
      },
    ]);
  };

  const handleCobrar = () => {
    if (!student) return;
    const pendente = payments.find((p) => p.status !== 'Pago');
    const phone = student.whatsapp || student.telefone;
    if (!pendente) {
      Alert.alert('Sem pendências', 'Este aluno não possui mensalidades pendentes.');
      return;
    }
    if (!phone) {
      Alert.alert('Sem WhatsApp', 'Cadastre o WhatsApp do aluno para enviar cobrança.');
      return;
    }
    const message = buildCobrancaMessage(pendente, academia?.nome ?? 'nossa academia');
    openWhatsapp(phone, message);
  };

  if (loading || !student) return null;

  return (
    <Screen>
      <ScreenHeader title="Perfil do aluno" onBack={() => router.back()} />

      <View style={styles.header}>
        <Avatar uri={student.fotoUrl} name={student.nomeCompleto} size={84} />
        <Text style={[styles.name, { color: colors.text }]}>{student.nomeCompleto}</Text>
        <View style={styles.badgeRow}>
          <Badge label={student.status} tone={student.status === 'Ativo' ? 'success' : 'neutral'} />
          <Badge label={student.modalidade} tone="primary" />
          {student.faixa && <Badge label={`Faixa ${student.faixa}`} tone="neutral" />}
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Editar" icon="create-outline" variant="outline" onPress={() => router.push(`/alunos/form?id=${student.id}`)} />
        <Button label="Cobrar" icon="logo-whatsapp" variant="primary" onPress={handleCobrar} />
      </View>

      <Card style={{ marginTop: 16 }}>
        <InfoRow label="CPF" value={student.cpf} colors={colors} />
        <InfoRow label="Nascimento" value={student.dataNascimento ? formatDate(student.dataNascimento) : undefined} colors={colors} />
        <InfoRow label="Telefone" value={student.telefone} colors={colors} />
        <InfoRow label="WhatsApp" value={student.whatsapp} colors={colors} />
        <InfoRow label="Endereço" value={student.endereco} colors={colors} />
        <InfoRow label="Professor" value={professor?.nome} colors={colors} />
        <InfoRow label="Graduação" value={student.graduacao} colors={colors} />
        <InfoRow label="Peso" value={student.peso ? `${student.peso} kg` : undefined} colors={colors} />
        <InfoRow label="Categoria" value={student.categoria} colors={colors} />
        <InfoRow label="Matrícula" value={formatDate(student.dataMatricula)} colors={colors} />
        <InfoRow label="Mensalidade" value={`${formatCurrency(student.valorMensalidade)} · dia ${student.diaVencimento}`} colors={colors} />
        {!!student.observacoes && <InfoRow label="Observações" value={student.observacoes} colors={colors} />}
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de mensalidades</Text>
      {payments.length === 0 ? (
        <Card>
          <EmptyState icon="cash-outline" title="Nenhuma mensalidade" message="Ainda não há registros de mensalidade para este aluno." />
        </Card>
      ) : (
        payments.map((p) => (
          <Card key={p.id} style={styles.paymentCard}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(p.valor)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Venc. {formatDate(p.vencimento)}</Text>
            </View>
            <Badge
              label={p.status}
              tone={p.status === 'Pago' ? 'success' : p.status === 'Vencido' ? 'danger' : 'warning'}
            />
          </Card>
        ))
      )}

      <Button label="Excluir aluno" variant="danger" icon="trash-outline" onPress={handleDelete} fullWidth style={{ marginTop: 20 }} />
    </Screen>
  );
}

function InfoRow({ label, value, colors }: { label: string; value?: string; colors: any }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 16, gap: 8 },
  name: { fontSize: 20, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000022',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
});
