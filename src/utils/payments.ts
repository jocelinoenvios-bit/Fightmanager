import { Payment, PaymentStatus } from '@/types';

export function computeStatus(payment: Pick<Payment, 'status' | 'vencimento' | 'dataPagamento'>): PaymentStatus {
  if (payment.dataPagamento) return 'Pago';
  const today = new Date().toISOString().slice(0, 10);
  return payment.vencimento < today ? 'Vencido' : 'Pendente';
}

export function daysUntil(dateIso: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateIso);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
