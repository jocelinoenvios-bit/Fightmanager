import { FinanceEntry } from '@/types';
import { createCollectionService } from './collectionService';

export function financeService(academiaId: string) {
  return createCollectionService<FinanceEntry>(academiaId, 'finance');
}
