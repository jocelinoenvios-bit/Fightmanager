import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { Button, Chip, Input, ScreenHeader } from '@/components';
import { signUpAndCreateAcademia, signUpWithInvite } from '@/services/auth';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'nova' | 'convite';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('nova');

  const [nomeAcademia, setNomeAcademia] = useState('');
  const [codigoAcademia, setCodigoAcademia] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!nomeResponsavel || !email || !senha) {
      setError('Preencha todos os campos.');
      return;
    }
    if (mode === 'nova' && !nomeAcademia) {
      setError('Informe o nome da academia.');
      return;
    }
    if (mode === 'convite' && !codigoAcademia) {
      setError('Informe o código da academia recebido do administrador.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Firebase não configurado',
        'Configure as variáveis EXPO_PUBLIC_FIREBASE_* no arquivo .env para habilitar o cadastro.'
      );
      return;
    }
    setLoading(true);
    try {
      if (mode === 'nova') {
        await signUpAndCreateAcademia({ nomeAcademia, nomeResponsavel, email: email.trim(), senha });
      } else {
        await signUpWithInvite({
          academiaId: codigoAcademia.trim(),
          nome: nomeResponsavel,
          email: email.trim(),
          senha,
        });
      }
      await refreshProfile();
      router.replace('/dashboard');
    } catch (e: any) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Cadastrar" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.modeRow}>
          <Chip label="Nova academia" selected={mode === 'nova'} onPress={() => setMode('nova')} />
          <Chip label="Tenho um convite" selected={mode === 'convite'} onPress={() => setMode('convite')} />
        </View>

        {mode === 'nova' ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Crie a conta da sua academia para começar a gerenciar alunos, professores e mensalidades.
          </Text>
        ) : (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Use o código da academia e o e-mail que o administrador cadastrou para você em Configurações →
            Equipe.
          </Text>
        )}

        {mode === 'nova' ? (
          <Input label="Nome da academia" value={nomeAcademia} onChangeText={setNomeAcademia} placeholder="Ex: Team Alpha Jiu-Jitsu" icon="business-outline" />
        ) : (
          <Input label="Código da academia" value={codigoAcademia} onChangeText={setCodigoAcademia} placeholder="Fornecido pelo administrador" autoCapitalize="none" icon="key-outline" />
        )}
        <Input label="Seu nome" value={nomeResponsavel} onChangeText={setNomeResponsavel} placeholder="Nome completo" icon="person-outline" />
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@academia.com" autoCapitalize="none" keyboardType="email-address" icon="mail-outline" />
        <Input label="Senha" value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" secureTextEntry icon="lock-closed-outline" />
        <Input label="Confirmar senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a senha" secureTextEntry icon="lock-closed-outline" />

        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

        <Button label="Criar conta" onPress={handleSignup} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Já tem uma conta?</Text>
          <Link href="/login" asChild>
            <Text style={{ ...styles.link, color: colors.primary }}>Entrar</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(e: any): string {
  switch (e?.code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'Senha muito fraca.';
    default:
      if (typeof e?.message === 'string' && e.message.includes('Convite não encontrado')) {
        return 'Convite não encontrado para este e-mail e código de academia. Confira com o administrador.';
      }
      return 'Não foi possível criar a conta. Tente novamente.';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  modeRow: { flexDirection: 'row', marginBottom: 16 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  error: { fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  link: { fontWeight: '700' },
});
