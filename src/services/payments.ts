import { Payment } from '@/types';
import { createCollectionService } from './collectionService';

export function paymentsService(academiaId: string) {
  return createCollectionService<Payment>(academiaId, 'payments');
}
