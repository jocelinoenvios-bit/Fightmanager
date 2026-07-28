import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from './Card';

export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
  hint,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
  hint?: string;
}) {
  const { colors } = useTheme();
  const toneColor = {
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
  }[tone];

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: toneColor + '22' }]}>
        <Ionicons name={icon} size={18} color={toneColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
      {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, gap: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 12.5, lineHeight: 16 },
  hint: { fontSize: 11, marginTop: 2 },
});
