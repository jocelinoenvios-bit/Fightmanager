import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function Card({ style, children, ...rest }: ViewProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
