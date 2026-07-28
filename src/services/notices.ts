import { Notice } from '@/types';
import { createCollectionService } from './collectionService';

export function noticesService(academiaId: string) {
  return createCollectionService<Notice>(academiaId, 'notices');
}
