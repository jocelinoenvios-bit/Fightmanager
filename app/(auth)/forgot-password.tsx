import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { Button, Input, ScreenHeader } from '@/components';
import { resetPassword } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!email) {
      setError('Informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      setError('Não foi possível enviar o e-mail. Verifique o endereço informado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Recuperar senha" onBack={() => router.back()} />
      <View style={styles.container}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Informe o e-mail cadastrado para receber o link de redefinição de senha.
        </Text>
        {sent ? (
          <Text style={[styles.success, { color: colors.success }]}>
            Enviamos um e-mail com as instruções para redefinir sua senha.
          </Text>
        ) : (
          <>
            <Input
              label="E-mail"
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@academia.com"
            />
            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            <Button label="Enviar link" onPress={handleReset} loading={loading} fullWidth size="lg" />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  error: { fontSize: 13, marginBottom: 8 },
  success: { fontSize: 14, lineHeight: 20 },
});
