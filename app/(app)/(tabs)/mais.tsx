import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademia } from '@/contexts/AcademiaContext';
import { Avatar, Card, Screen, ScreenHeader } from '@/components';

const ITEMS: {
  href: '/professores' | '/agenda' | '/financeiro' | '/cobranca' | '/relatorios' | '/configuracoes';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { href: '/agenda', title: 'Agenda', subtitle: 'Turmas, horários e professores', icon: 'calendar-outline' },
  { href: '/professores', title: 'Professores', subtitle: 'Equipe da academia', icon: 'school-outline' },
  { href: '/financeiro', title: 'Financeiro', subtitle: 'Receitas, despesas e lucro', icon: 'wallet-outline' },
  { href: '/cobranca', title: 'Cobrança WhatsApp', subtitle: 'Mensalidades vencendo e vencidas', icon: 'logo-whatsapp' },
  { href: '/relatorios', title: 'Relatórios', subtitle: 'Exportar em PDF e Excel', icon: 'bar-chart-outline' },
  { href: '/configuracoes', title: 'Configurações', subtitle: 'Dados da academia e avisos', icon: 'settings-outline' },
];

export default function MaisScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { academia } = useAcademia();

  return (
    <Screen>
      <ScreenHeader
        title="Mais"
        subtitle={academia?.nome}
        right={<Avatar name={profile?.nome ?? '?'} uri={profile?.fotoUrl} size={40} />}
      />

      {ITEMS.map((item) => (
        <Pressable key={item.href} onPress={() => router.push(item.href)}>
          <Card style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
});
