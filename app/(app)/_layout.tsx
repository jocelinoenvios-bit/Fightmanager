import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AcademiaProvider } from '@/contexts/AcademiaContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function AppLayout() {
  const { loading, firebaseUser } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!firebaseUser) return <Redirect href="/login" />;

  return (
    <AcademiaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="professores/index" />
        <Stack.Screen name="professores/form" />
        <Stack.Screen name="agenda/index" />
        <Stack.Screen name="agenda/form" />
        <Stack.Screen name="financeiro/index" />
        <Stack.Screen name="cobranca/index" />
        <Stack.Screen name="relatorios/index" />
        <Stack.Screen name="configuracoes/index" />
      </Stack>
    </AcademiaProvider>
  );
}
