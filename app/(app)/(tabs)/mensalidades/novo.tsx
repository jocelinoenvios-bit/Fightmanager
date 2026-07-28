import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Screen, ScreenHeader, SelectField } from '@/components';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { PaymentMethod, Student } from '@/types';
import { todayIso } from '@/utils/format';
import { computeStatus } from '@/utils/payments';

const METODOS: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Transferência'];

export default function NovaMensalidadeScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string | undefined>();
  const [mesReferencia, setMesReferencia] = useState(todayIso().slice(0, 7));
  const [vencimento, setVencimento] = useState(todayIso());
  const [valor, setValor] = useState('');
  const [jaPago, setJaPago] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(todayIso());
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Pix');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!academiaId) return;
    studentsService(academiaId)
      .list()
      .then((list) => setStudents(list.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))));
  }, [academiaId]);

  const student = students.find((s) => s.id === studentId);

  useEffect(() => {
    if (!student) return;
    setValor(String(student.valorMensalidade));
    const [y, m] = mesReferencia.split('-').map(Number);
    const venc = new Date(y, (m || 1) - 1, student.diaVencimento || 10);
    setVencimento(venc.toISOString().slice(0, 10));
  }, [student, mesReferencia]);

  const handleSave = async () => {
    setError('');
    if (!academiaId || !student) {
      setError('Selecione um aluno.');
      return;
    }
    if (!valor || Number.isNaN(Number(valor))) {
      setError('Informe um valor válido.');
      return;
    }
    setSaving(true);
    try {
      await paymentsService(academiaId).create({
        academiaId,
        studentId: student.id,
        studentNome: student.nomeCompleto,
        mesReferencia,
        valor: Number(valor),
        vencimento,
        dataPagamento: jaPago ? dataPagamento : undefined,
        formaPagamento: jaPago ? formaPagamento : undefined,
        status: jaPago ? 'Pago' : computeStatus({ vencimento, dataPagamento: undefined, status: 'Pendente' }),
        createdAt: Date.now(),
      });
      router.back();
    } catch {
      setError('Não foi possível salvar a mensalidade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Nova mensalidade" onBack={() => router.back()} />

      <SelectField
        label="Aluno"
        value={student?.nomeCompleto}
        options={students.map((s) => s.nomeCompleto)}
        onChange={(nome) => setStudentId(students.find((s) => s.nomeCompleto === nome)?.id)}
        placeholder="Selecionar aluno"
      />
      <Input label="Mês de referência" value={mesReferencia} onChangeText={setMesReferencia} placeholder="AAAA-MM" />
      <Input label="Valor (R$)" value={valor} onChangeText={setValor} keyboardType="numeric" />
      <Input label="Data de vencimento" value={vencimento} onChangeText={setVencimento} placeholder="AAAA-MM-DD" />

      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Pagamento antecipado / já pago</Text>
        <Switch value={jaPago} onValueChange={setJaPago} trackColor={{ true: colors.primary }} />
      </View>

      {jaPago && (
        <>
          <Input label="Data do pagamento" value={dataPagamento} onChangeText={setDataPagamento} placeholder="AAAA-MM-DD" />
          <SelectField label="Forma de pagamento" value={formaPagamento} options={METODOS} onChange={setFormaPagamento} />
        </>
      )}

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      <Button label="Salvar mensalidade" onPress={handleSave} loading={saving} fullWidth size="lg" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
});
