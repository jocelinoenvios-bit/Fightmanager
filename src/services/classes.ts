import { ClassSession } from '@/types';
import { createCollectionService } from './collectionService';

export function classesService(academiaId: string) {
  return createCollectionService<ClassSession>(academiaId, 'classes');
}
