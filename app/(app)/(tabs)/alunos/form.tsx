import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, PhotoPicker, ScreenHeader, SelectField } from '@/components';
import { Screen } from '@/components';
import { studentsService } from '@/services/students';
import { teachersService } from '@/services/teachers';
import { uploadImageAsync } from '@/services/uploadImage';
import { FaixaJiuJitsu, Modalidade, Student, StudentStatus, Teacher } from '@/types';
import { formatCpf, formatPhone, todayIso } from '@/utils/format';

const MODALIDADES: Modalidade[] = ['Jiu-Jitsu', 'Boxe'];
const STATUSES: StudentStatus[] = ['Ativo', 'Inativo', 'Trancado'];
const FAIXAS: FaixaJiuJitsu[] = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];

export default function StudentFormScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [fotoUrl, setFotoUrl] = useState<string | undefined>();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade>('Jiu-Jitsu');
  const [professorId, setProfessorId] = useState<string | undefined>();
  const [faixa, setFaixa] = useState<FaixaJiuJitsu | undefined>();
  const [graduacao, setGraduacao] = useState('');
  const [peso, setPeso] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataMatricula, setDataMatricula] = useState(todayIso());
  const [valorMensalidade, setValorMensalidade] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('10');
  const [status, setStatus] = useState<StudentStatus>('Ativo');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!academiaId) return;
    teachersService(academiaId)
      .list()
      .then(setTeachers);
  }, [academiaId]);

  useEffect(() => {
    if (!academiaId || !id) return;
    studentsService(academiaId)
      .get(id)
      .then((s) => {
        if (!s) return;
        setFotoUrl(s.fotoUrl);
        setNomeCompleto(s.nomeCompleto);
        setCpf(s.cpf ?? '');
        setDataNascimento(s.dataNascimento ?? '');
        setTelefone(s.telefone ?? '');
        setWhatsapp(s.whatsapp ?? '');
        setEndereco(s.endereco ?? '');
        setModalidade(s.modalidade);
        setProfessorId(s.professorId);
        setFaixa(s.faixa);
        setGraduacao(s.graduacao ?? '');
        setPeso(s.peso ? String(s.peso) : '');
        setCategoria(s.categoria ?? '');
        setDataMatricula(s.dataMatricula);
        setValorMensalidade(String(s.valorMensalidade ?? ''));
        setDiaVencimento(String(s.diaVencimento ?? '10'));
        setStatus(s.status);
        setObservacoes(s.observacoes ?? '');
        setLoading(false);
      });
  }, [academiaId, id]);

  const professorNome = (pid?: string) => teachers.find((t) => t.id === pid)?.nome;

  const handlePickPhoto = async (localUri: string) => {
    if (!academiaId) return;
    const path = `academias/${academiaId}/students/${id ?? 'novo'}-${Date.now()}.jpg`;
    const url = await uploadImageAsync(localUri, path);
    setFotoUrl(url);
  };

  const handleSave = async () => {
    setError('');
    if (!nomeCompleto.trim()) {
      setError('Informe o nome completo do aluno.');
      return;
    }
    if (!valorMensalidade || Number.isNaN(Number(valorMensalidade))) {
      setError('Informe um valor de mensalidade válido.');
      return;
    }
    if (!academiaId) return;

    setSaving(true);
    try {
      const payload: Omit<Student, 'id'> = {
        academiaId,
        fotoUrl,
        nomeCompleto: nomeCompleto.trim(),
        cpf,
        dataNascimento,
        telefone,
        whatsapp,
        endereco,
        modalidade,
        professorId,
        faixa: modalidade === 'Jiu-Jitsu' ? faixa : undefined,
        graduacao,
        peso: peso ? Number(peso) : undefined,
        categoria,
        dataMatricula,
        valorMensalidade: Number(valorMensalidade),
        diaVencimento: Number(diaVencimento) || 10,
        status,
        observacoes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (isEdit && id) {
        await studentsService(academiaId).update(id, payload);
      } else {
        await studentsService(academiaId).create(payload);
      }
      router.back();
    } catch (e) {
      setError('Não foi possível salvar o aluno. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Screen>
      <ScreenHeader title={isEdit ? 'Editar aluno' : 'Novo aluno'} onBack={() => router.back()} />

      <PhotoPicker uri={fotoUrl} name={nomeCompleto || 'Aluno'} onPick={handlePickPhoto} />

      <Text style={[styles.section, { color: colors.textSecondary }]}>DADOS PESSOAIS</Text>
      <Input label="Nome completo" value={nomeCompleto} onChangeText={setNomeCompleto} placeholder="Nome do aluno" />
      <Input label="CPF" value={cpf} onChangeText={(v) => setCpf(formatCpf(v))} placeholder="000.000.000-00" keyboardType="numeric" />
      <Input label="Data de nascimento" value={dataNascimento} onChangeText={setDataNascimento} placeholder="AAAA-MM-DD" />
      <Input label="Telefone" value={telefone} onChangeText={(v) => setTelefone(formatPhone(v))} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
      <Input label="WhatsApp" value={whatsapp} onChangeText={(v) => setWhatsapp(formatPhone(v))} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
      <Input label="Endereço" value={endereco} onChangeText={setEndereco} placeholder="Rua, número, bairro" />

      <Text style={[styles.section, { color: colors.textSecondary }]}>TREINO</Text>
      <SelectField label="Modalidade" value={modalidade} options={MODALIDADES} onChange={setModalidade} />
      <SelectField
        label="Professor responsável"
        value={professorNome(professorId)}
        options={teachers.map((t) => t.nome)}
        onChange={(nome) => setProfessorId(teachers.find((t) => t.nome === nome)?.id)}
        placeholder="Selecionar professor"
      />
      {modalidade === 'Jiu-Jitsu' && (
        <SelectField label="Faixa" value={faixa} options={FAIXAS} onChange={setFaixa} placeholder="Selecionar faixa" />
      )}
      <Input label="Graduação (graus)" value={graduacao} onChangeText={setGraduacao} placeholder="Ex: 2 graus" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="70" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Categoria" value={categoria} onChangeText={setCategoria} placeholder="Ex: Peso pena" />
        </View>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>MATRÍCULA E MENSALIDADE</Text>
      <Input label="Data de matrícula" value={dataMatricula} onChangeText={setDataMatricula} placeholder="AAAA-MM-DD" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Valor da mensalidade (R$)" value={valorMensalidade} onChangeText={setValorMensalidade} placeholder="150" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Dia do vencimento" value={diaVencimento} onChangeText={setDiaVencimento} placeholder="10" keyboardType="numeric" />
        </View>
      </View>
      <SelectField label="Status" value={status} options={STATUSES} onChange={setStatus} />
      <Input label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Observações gerais" multiline numberOfLines={3} />

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      <Button label="Salvar aluno" onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
});
