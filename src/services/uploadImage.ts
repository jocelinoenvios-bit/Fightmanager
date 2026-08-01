import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const UPLOAD_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// A stalled network/Storage connection would otherwise leave the caller's upload
// spinner running forever, since fetch/uploadBytes never reject on their own in
// that case — this guarantees the promise always settles.
export async function uploadImageAsync(localUri: string, path: string): Promise<string> {
  return withTimeout(
    (async () => {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    })(),
    UPLOAD_TIMEOUT_MS,
    'Tempo esgotado ao enviar a imagem.'
  );
}
