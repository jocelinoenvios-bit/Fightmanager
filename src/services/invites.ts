import { doc, getDoc } from 'firebase/firestore';
import { Invite } from '@/types';
import { createCollectionService } from './collectionService';
import { db } from './firebase';

export function invitesService(academiaId: string) {
  return createCollectionService<Invite>(academiaId, 'invites');
}

export async function getInvite(academiaId: string, email: string): Promise<Invite | null> {
  const id = email.trim().toLowerCase();
  const snap = await getDoc(doc(db, 'academias', academiaId, 'invites', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Invite) : null;
}
