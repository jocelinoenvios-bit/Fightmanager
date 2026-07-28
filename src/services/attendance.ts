import { AttendanceRecord } from '@/types';
import { createCollectionService } from './collectionService';

export function attendanceService(academiaId: string) {
  return createCollectionService<AttendanceRecord>(academiaId, 'attendance');
}
