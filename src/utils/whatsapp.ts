import { Linking } from 'react-native';
import { formatCurrency, formatDate } from './format';
import { onlyDigits } from './format';
import { Payment } from '@/types';

export function buildCobrancaMessage(payment: Payment, academiaNome: string): string {
  const primeiroNome = payment.studentNome.split(' ')[0];
  const venceu = payment.vencimento < new Date().toISOString().slice(0, 10);

  if (venceu) {
    return `Olá, ${primeiroNome}! Sua mensalidade da ${academiaNome} venceu em ${formatDate(
      payment.vencimento
    )} no valor de ${formatCurrency(payment.valor)}. Caso já tenha realizado o pagamento, desconsidere esta mensagem. Caso contrário, entre em contato conosco. Obrigado!`;
  }

  return `Olá, ${primeiroNome}! Sua mensalidade da ${academiaNome} vence em ${formatDate(
    payment.vencimento
  )} no valor de ${formatCurrency(payment.valor)}. Qualquer dúvida, estamos à disposição. Obrigado!`;
}

export function whatsappUrl(phone: string, message: string): string {
  const digits = onlyDigits(phone);
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export async function openWhatsapp(phone: string, message: string) {
  const url = whatsappUrl(phone, message);
  await Linking.openURL(url);
}
