import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function AuthLayout() {
  const { loading, firebaseUser } = useAuth();

  if (loading) return <LoadingScreen />;
  if (firebaseUser) return <Redirect href="/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
