import { Student } from '@/types';
import { createCollectionService } from './collectionService';

export function studentsService(academiaId: string) {
  return createCollectionService<Student>(academiaId, 'students');
}
