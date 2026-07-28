import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  setDoc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export function createCollectionService<T extends { id: string }>(
  academiaId: string,
  subPath: string
) {
  const colRef = collection(db, 'academias', academiaId, subPath);

  return {
    async list(...constraints: QueryConstraint[]): Promise<T[]> {
      const q = constraints.length ? query(colRef, ...constraints) : query(colRef);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as T[];
    },
    subscribe(
      onData: (items: T[]) => void,
      onError?: (err: Error) => void,
      ...constraints: QueryConstraint[]
    ): Unsubscribe {
      const q = constraints.length ? query(colRef, ...constraints) : query(colRef);
      return onSnapshot(
        q,
        (snap) => {
          onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as T[]);
        },
        (err) => onError?.(err)
      );
    },
    async get(id: string): Promise<T | null> {
      const snap = await getDoc(doc(colRef, id));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as T) : null;
    },
    async create(data: Omit<T, 'id'>): Promise<string> {
      const ref = await addDoc(colRef, data as DocumentData);
      return ref.id;
    },
    async update(id: string, data: Partial<T>): Promise<void> {
      await updateDoc(doc(colRef, id), data as DocumentData);
    },
    async upsert(id: string, data: Partial<T>): Promise<void> {
      await setDoc(doc(colRef, id), data as DocumentData, { merge: true });
    },
    async remove(id: string): Promise<void> {
      await deleteDoc(doc(colRef, id));
    },
    colRef,
  };
}

export { orderBy, query, where, limit } from 'firebase/firestore';
