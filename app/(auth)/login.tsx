import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { Button, Input } from '@/components';
import { signIn } from '@/services/auth';
import { isFirebaseConfigured } from '@/services/firebase';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !senha) {
      setError('Informe e-mail e senha.');
      return;
    }
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Firebase não configurado',
        'Configure as variáveis EXPO_PUBLIC_FIREBASE_* no arquivo .env para habilitar o login.'
      );
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), senha);
      router.replace('/dashboard');
    } catch (e: any) {
      setError(mapAuthError(e?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={30} color={colors.onPrimary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>FightManager</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Gestão completa da sua academia
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="E-mail"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@academia.com"
          />
          <Input
            label="Senha"
            icon="lock-closed-outline"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
          />
          {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <Link href="/forgot-password" asChild>
            <Text style={{ ...styles.forgot, color: colors.primary }}>Esqueceu sua senha?</Text>
          </Link>

          <Button label="Entrar" onPress={handleLogin} loading={loading} fullWidth size="lg" />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Ainda não tem uma academia cadastrada?</Text>
          <Link href="/signup" asChild>
            <Text style={{ ...styles.link, color: colors.primary }}>Cadastrar academia</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(code?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    default:
      return 'Não foi possível entrar. Verifique seus dados e tente novamente.';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 14, marginTop: 4 },
  form: { marginBottom: 32 },
  error: { fontSize: 13, marginBottom: 8 },
  forgot: { textAlign: 'right', marginBottom: 20, fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  link: { fontWeight: '700' },
});
