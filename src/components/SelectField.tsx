import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

interface SelectFieldProps<T extends string> {
  label?: string;
  value?: T;
  placeholder?: string;
  options: readonly T[];
  onChange: (value: T) => void;
  error?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  placeholder = 'Selecionar',
  options,
  onChange,
  error,
}: SelectFieldProps<T>) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBg,
            borderRadius: radius.md,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <Text style={{ color: value ? colors.text : colors.textMuted, fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
            {label && <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>}
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.option, { borderBottomColor: colors.border }]}
                >
                  <Text style={{ color: item === value ? colors.primary : colors.text, fontSize: 15, fontWeight: item === value ? '700' : '400' }}>
                    {item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderWidth: 1,
  },
  error: { fontSize: 12, marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 16, paddingBottom: 32, maxHeight: '70%' },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
