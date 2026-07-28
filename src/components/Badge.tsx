import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors, radius } = useTheme();

  const toneMap: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerMuted + '33', fg: colors.danger },
    primary: { bg: colors.primary + '26', fg: colors.primary },
    neutral: { bg: colors.border, fg: colors.textSecondary },
  };

  const { bg, fg } = toneMap[tone];

  return (
    <View style={[styles.base, { backgroundColor: bg, borderRadius: radius.pill }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
