import { doc, getDoc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { Academia } from '@/types';
import { db } from './firebase';

export async function getAcademia(academiaId: string): Promise<Academia | null> {
  const snap = await getDoc(doc(db, 'academias', academiaId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Academia) : null;
}

export function subscribeAcademia(
  academiaId: string,
  onData: (academia: Academia | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'academias', academiaId), (snap) => {
    onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Academia) : null);
  });
}

export async function updateAcademia(academiaId: string, data: Partial<Academia>): Promise<void> {
  await updateDoc(doc(db, 'academias', academiaId), data);
}
