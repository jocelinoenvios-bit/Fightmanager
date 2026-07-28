import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseAuth, db } from './firebase';
import { Academia, UserProfile } from '@/types';
import { getInvite } from './invites';

export async function signIn(email: string, senha: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, senha);
  return cred.user;
}

export async function signOutUser() {
  await firebaseSignOut(firebaseAuth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function signUpAndCreateAcademia(params: {
  nomeAcademia: string;
  nomeResponsavel: string;
  email: string;
  senha: string;
}) {
  const { nomeAcademia, nomeResponsavel, email, senha } = params;
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, senha);
  await updateProfile(cred.user, { displayName: nomeResponsavel });

  const academiaRef = await addDoc(collection(db, 'academias'), {
    nome: nomeAcademia,
    ownerUid: cred.user.uid,
    createdAt: Date.now(),
  } satisfies Omit<Academia, 'id'>);

  const profile: UserProfile = {
    uid: cred.user.uid,
    academiaId: academiaRef.id,
    nome: nomeResponsavel,
    email,
    role: 'admin',
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), profile);

  return { user: cred.user, academiaId: academiaRef.id };
}

export async function signUpWithInvite(params: {
  academiaId: string;
  nome: string;
  email: string;
  senha: string;
}) {
  const { academiaId, nome, senha } = params;
  const email = params.email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, senha);

  try {
    const invite = await getInvite(academiaId, email);
    if (!invite) {
      throw new Error('Convite não encontrado para este e-mail nesta academia.');
    }

    await updateProfile(cred.user, { displayName: nome });

    const profile: UserProfile = {
      uid: cred.user.uid,
      academiaId,
      nome,
      email,
      role: invite.role,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    await deleteDoc(doc(db, 'academias', academiaId, 'invites', email));

    return { user: cred.user, academiaId };
  } catch (error) {
    // Roll back the auth account so a failed invite redemption doesn't leave an
    // orphaned login with no academia/profile behind.
    await deleteUser(cred.user).catch(() => {});
    throw error;
  }
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
