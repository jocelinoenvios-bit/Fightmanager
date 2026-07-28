import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Screen, ScreenHeader } from '@/components';
import { studentsService } from '@/services/students';
import { paymentsService } from '@/services/payments';
import { attendanceService } from '@/services/attendance';
import { teachersService } from '@/services/teachers';
import { financeService } from '@/services/finance';
import { Student, Payment, AttendanceRecord, Teacher, FinanceEntry } from '@/types';
import { formatCurrency, formatDate, todayIso } from '@/utils/format';
import { computeStatus } from '@/utils/payments';
import { exportCsv, exportPdf } from '@/utils/export';

export default function RelatoriosScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [finance, setFinance] = useState<FinanceEntry[]>([]);

  const load = useCallback(async () => {
    if (!academiaId) return;
    const [s, p, a, t, f] = await Promise.all([
      studentsService(academiaId).list(),
      paymentsService(academiaId).list(),
      attendanceService(academiaId).list(),
      teachersService(academiaId).list(),
      financeService(academiaId).list(),
    ]);
    setStudents(s);
    setPayments(p.map((item) => ({ ...item, status: computeStatus(item) })));
    setAttendance(a);
    setTeachers(t);
    setFinance(f);
  }, [academiaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ativos = students.filter((s) => s.status === 'Ativo');
  const inadimplentes = students.filter((s) =>
    payments.some((p) => p.studentId === s.id && p.status === 'Vencido')
  );
  const receitaTotal = finance.filter((e) => e.tipo === 'Receita').reduce((s, e) => s + e.valor, 0);
  const despesaTotal = finance.filter((e) => e.tipo === 'Despesa').reduce((s, e) => s + e.valor, 0);

  const reports = [
    {
      key: 'alunos-ativos',
      title: 'Alunos ativos',
      value: `${ativos.length} alunos`,
      csv: () =>
        exportCsv(
          'alunos-ativos',
          ['Nome', 'Modalidade', 'Professor', 'Mensalidade', 'Vencimento'],
          ativos.map((s) => [s.nomeCompleto, s.modalidade, s.professorId ?? '-', s.valorMensalidade, s.diaVencimento])
        ),
    },
    {
      key: 'inadimplentes',
      title: 'Alunos inadimplentes',
      value: `${inadimplentes.length} alunos`,
      csv: () =>
        exportCsv(
          'alunos-inadimplentes',
          ['Nome', 'Modalidade', 'Mensalidade'],
          inadimplentes.map((s) => [s.nomeCompleto, s.modalidade, s.valorMensalidade])
        ),
    },
    {
      key: 'frequencia',
      title: 'Frequência (check-ins)',
      value: `${attendance.length} registros`,
      csv: () =>
        exportCsv(
          'frequencia',
          ['Aluno', 'Data', 'Horário', 'Método'],
          attendance.map((a) => [a.studentNome, formatDate(a.data), a.horario, a.metodo])
        ),
    },
    {
      key: 'professores',
      title: 'Professores',
      value: `${teachers.length} cadastrados`,
      csv: () =>
        exportCsv(
          'professores',
          ['Nome', 'Especialidade', 'Salário'],
          teachers.map((t) => [t.nome, t.especialidade, t.salario ?? 0])
        ),
    },
    {
      key: 'mensalidades',
      title: 'Mensalidades',
      value: `${payments.length} lançamentos`,
      csv: () =>
        exportCsv(
          'mensalidades',
          ['Aluno', 'Referência', 'Valor', 'Vencimento', 'Status', 'Forma de pagamento'],
          payments.map((p) => [p.studentNome, p.mesReferencia, p.valor, formatDate(p.vencimento), p.status, p.formaPagamento ?? '-'])
        ),
    },
    {
      key: 'financeiro',
      title: 'Receitas, despesas e lucro',
      value: `Lucro total: ${formatCurrency(receitaTotal - despesaTotal)}`,
      csv: () =>
        exportCsv(
          'financeiro',
          ['Tipo', 'Categoria', 'Valor', 'Data', 'Descrição'],
          finance.map((e) => [e.tipo, e.categoria, e.valor, formatDate(e.data), e.descricao ?? ''])
        ),
      pdf: () =>
        exportPdf(
          'Relatório financeiro',
          `<p><b>Receita total:</b> ${formatCurrency(receitaTotal)}</p>
           <p><b>Despesa total:</b> ${formatCurrency(despesaTotal)}</p>
           <p><b>Lucro:</b> ${formatCurrency(receitaTotal - despesaTotal)}</p>
           <table width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse; margin-top:16px;">
             <tr style="background:#F1F5F9;"><th align="left">Tipo</th><th align="left">Categoria</th><th align="left">Valor</th><th align="left">Data</th></tr>
             ${finance
               .map(
                 (e) =>
                   `<tr style="border-bottom:1px solid #E2E8F0;"><td>${e.tipo}</td><td>${e.categoria}</td><td>${formatCurrency(e.valor)}</td><td>${formatDate(e.data)}</td></tr>`
               )
               .join('')}
           </table>`
        ),
    },
  ];

  return (
    <Screen>
      <ScreenHeader title="Relatórios" subtitle="Exporte em PDF ou Excel (CSV)" onBack={() => router.back()} />

      {reports.map((report) => (
        <Card key={report.key} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{report.title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{report.value}</Text>
          </View>
          <View style={styles.actions}>
            <Button label="Excel" size="sm" variant="outline" icon="document-text-outline" onPress={report.csv} />
            {report.pdf && <Button label="PDF" size="sm" icon="print-outline" onPress={report.pdf} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  title: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
});
