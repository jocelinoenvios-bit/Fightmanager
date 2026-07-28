import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Chip, Input, Screen, ScreenHeader, SelectField } from '@/components';
import { classesService } from '@/services/classes';
import { teachersService } from '@/services/teachers';
import { ClassSession, Modalidade, Teacher } from '@/types';

const MODALIDADES: Modalidade[] = ['Jiu-Jitsu', 'Boxe'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function TurmaFormScreen() {
  const { colors } = useTheme();
  const { academiaId } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [nome, setNome] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade>('Jiu-Jitsu');
  const [professorId, setProfessorId] = useState<string | undefined>();
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [horarioInicio, setHorarioInicio] = useState('19:00');
  const [horarioFim, setHorarioFim] = useState('20:00');
  const [limiteAlunos, setLimiteAlunos] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!academiaId) return;
    teachersService(academiaId).list().then(setTeachers);
  }, [academiaId]);

  useEffect(() => {
    if (!academiaId || !id) return;
    classesService(academiaId)
      .get(id)
      .then((turma) => {
        if (!turma) return;
        setNome(turma.nome);
        setModalidade(turma.modalidade);
        setProfessorId(turma.professorId);
        setDiasSemana(turma.diasSemana);
        setHorarioInicio(turma.horarioInicio);
        setHorarioFim(turma.horarioFim);
        setLimiteAlunos(turma.limiteAlunos ? String(turma.limiteAlunos) : '');
      });
  }, [academiaId, id]);

  const toggleDia = (index: number) => {
    setDiasSemana((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index].sort()));
  };

  const handleSave = async () => {
    setError('');
    if (!nome.trim()) {
      setError('Informe o nome da turma.');
      return;
    }
    if (diasSemana.length === 0) {
      setError('Selecione ao menos um dia da semana.');
      return;
    }
    if (!academiaId) return;
    setSaving(true);
    try {
      const professor = teachers.find((t) => t.id === professorId);
      const payload: Omit<ClassSession, 'id'> = {
        academiaId,
        nome: nome.trim(),
        modalidade,
        professorId,
        professorNome: professor?.nome,
        diasSemana,
        horarioInicio,
        horarioFim,
        limiteAlunos: limiteAlunos ? Number(limiteAlunos) : undefined,
        createdAt: Date.now(),
      };
      if (isEdit && id) {
        await classesService(academiaId).update(id, payload);
      } else {
        await classesService(academiaId).create(payload);
      }
      router.back();
    } catch {
      setError('Não foi possível salvar a turma.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={isEdit ? 'Editar turma' : 'Nova turma'} onBack={() => router.back()} />

      <Input label="Nome da turma" value={nome} onChangeText={setNome} placeholder="Ex: Jiu-Jitsu Avançado" />
      <SelectField label="Modalidade" value={modalidade} options={MODALIDADES} onChange={setModalidade} />
      <SelectField
        label="Professor responsável"
        value={teachers.find((t) => t.id === professorId)?.nome}
        options={teachers.map((t) => t.nome)}
        onChange={(nomeSel) => setProfessorId(teachers.find((t) => t.nome === nomeSel)?.id)}
        placeholder="Selecionar professor"
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Dias da semana</Text>
      <View style={styles.chips}>
        {DIAS.map((label, index) => (
          <Chip key={label} label={label} selected={diasSemana.includes(index)} onPress={() => toggleDia(index)} />
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Horário início" value={horarioInicio} onChangeText={setHorarioInicio} placeholder="19:00" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Horário fim" value={horarioFim} onChangeText={setHorarioFim} placeholder="20:00" />
        </View>
      </View>
      <Input label="Limite de alunos" value={limiteAlunos} onChangeText={setLimiteAlunos} placeholder="Ex: 25" keyboardType="numeric" />

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      <Button label="Salvar turma" onPress={handleSave} loading={saving} fullWidth size="lg" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
});
