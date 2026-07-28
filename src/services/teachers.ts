import { Teacher } from '@/types';
import { createCollectionService } from './collectionService';

export function teachersService(academiaId: string) {
  return createCollectionService<Teacher>(academiaId, 'teachers');
}
