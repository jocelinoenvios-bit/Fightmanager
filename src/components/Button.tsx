import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

type Variant = 'primary' | 'danger' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors, radius } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : 'transparent';
  const borderColor = variant === 'outline' ? colors.border : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'outline'
        ? colors.text
        : colors.primary;

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: radius.md,
          paddingVertical,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fontSize + 4} color={textColor} style={styles.icon} />}
          <Text style={[styles.label, { color: textColor, fontSize }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 2,
  },
});
