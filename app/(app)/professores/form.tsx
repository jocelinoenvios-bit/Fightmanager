import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, PhotoPicker, Screen, ScreenHeader, SelectField } from '@/components';
import { teachersService } from '@/services/teachers';
import { uploadImageAsync } from '@/services/uploadImage';
import { Teacher } from '@/types';
import { formatCpf, formatPhone, todayIso } from '@/utils/format';

const ESPECIALIDADES = ['Jiu-Jitsu', 'Boxe', 'Ambos'] as const;

export default function TeacherFormScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [fotoUrl, setFotoUrl] = useState<string | undefined>();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [especialidade, setEspecialidade] = useState<Teacher['especialidade']>('Jiu-Jitsu');
  const [dataContratacao, setDataContratacao] = useState(todayIso());
  const [salario, setSalario] = useState('');
  const [horariosTrabalho, setHorariosTrabalho] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!academiaId || !id) return;
    teachersService(academiaId)
      .get(id)
      .then((t) => {
        if (!t) return;
        setFotoUrl(t.fotoUrl);
        setNome(t.nome);
        setCpf(t.cpf ?? '');
        setTelefone(t.telefone ?? '');
        setWhatsapp(t.whatsapp ?? '');
        setEspecialidade(t.especialidade);
        setDataContratacao(t.dataContratacao ?? todayIso());
        setSalario(t.salario ? String(t.salario) : '');
        setHorariosTrabalho(t.horariosTrabalho ?? '');
        setObservacoes(t.observacoes ?? '');
      });
  }, [academiaId, id]);

  const handlePickPhoto = async (localUri: string) => {
    if (!academiaId) return;
    const url = await uploadImageAsync(localUri, `academias/${academiaId}/teachers/${id ?? 'novo'}-${Date.now()}.jpg`);
    setFotoUrl(url);
  };

  const handleSave = async () => {
    setError('');
    if (!nome.trim()) {
      setError('Informe o nome do professor.');
      return;
    }
    if (!academiaId) return;
    setSaving(true);
    try {
      const payload: Omit<Teacher, 'id'> = {
        academiaId,
        fotoUrl,
        nome: nome.trim(),
        cpf,
        telefone,
        whatsapp,
        especialidade,
        dataContratacao,
        salario: salario ? Number(salario) : undefined,
        horariosTrabalho,
        observacoes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (isEdit && id) {
        await teachersService(academiaId).update(id, payload);
      } else {
        await teachersService(academiaId).create(payload);
      }
      router.back();
    } catch {
      setError('Não foi possível salvar o professor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={isEdit ? 'Editar professor' : 'Novo professor'} onBack={() => router.back()} />
      <PhotoPicker uri={fotoUrl} name={nome || 'Professor'} onPick={handlePickPhoto} />

      <Input label="Nome completo" value={nome} onChangeText={setNome} placeholder="Nome do professor" />
      <Input label="CPF" value={cpf} onChangeText={(v) => setCpf(formatCpf(v))} placeholder="000.000.000-00" keyboardType="numeric" />
      <Input label="Telefone" value={telefone} onChangeText={(v) => setTelefone(formatPhone(v))} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
      <Input label="WhatsApp" value={whatsapp} onChangeText={(v) => setWhatsapp(formatPhone(v))} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
      <SelectField label="Especialidade" value={especialidade} options={ESPECIALIDADES} onChange={setEspecialidade} />
      <Input label="Data de contratação" value={dataContratacao} onChangeText={setDataContratacao} placeholder="AAAA-MM-DD" />
      <Input label="Salário (R$)" value={salario} onChangeText={setSalario} placeholder="2500" keyboardType="numeric" />
      <Input label="Horários de trabalho" value={horariosTrabalho} onChangeText={setHorariosTrabalho} placeholder="Seg a Sex, 18h-22h" />
      <Input label="Observações" value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={3} />

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      <Button label="Salvar professor" onPress={handleSave} loading={saving} fullWidth size="lg" />
    </Screen>
  );
}
