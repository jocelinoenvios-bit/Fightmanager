import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Button } from './Button';
import { SelectField } from './SelectField';
import { Input } from './Input';
import { PaymentMethod } from '@/types';
import { todayIso } from '@/utils/format';

const METODOS: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Transferência'];

export function RegisterPaymentModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { dataPagamento: string; formaPagamento: PaymentMethod }) => Promise<void> | void;
}) {
  const { colors, radius } = useTheme();
  const [dataPagamento, setDataPagamento] = useState(todayIso());
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Pix');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm({ dataPagamento, formaPagamento });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
          <Text style={[styles.title, { color: colors.text }]}>Registrar pagamento</Text>
          <Input label="Data do pagamento" value={dataPagamento} onChangeText={setDataPagamento} placeholder="AAAA-MM-DD" />
          <SelectField label="Forma de pagamento" value={formaPagamento} options={METODOS} onChange={setFormaPagamento} />
          <Button label="Confirmar pagamento" onPress={handleConfirm} loading={saving} fullWidth size="lg" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
});
