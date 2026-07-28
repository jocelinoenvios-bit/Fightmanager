import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Index() {
  const { loading, firebaseUser } = useAuth();

  if (loading) return <LoadingScreen />;

  return <Redirect href={firebaseUser ? '/dashboard' : '/login'} />;
}
