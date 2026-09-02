// Petit pub-sub sans dépendance : sert uniquement à signaler un échec de
// mutation optimiste (rollback silencieux côté cache + toast discret côté
// UI), pas un système de notifications complet. Un seul flux global suffit
// pour une app mono-utilisateur.
export type ToastMessage = { id: number; text: string };

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function showToast(text: string) {
  const id = nextId++;
  toasts = [...toasts, { id, text }];
  emit();
  setTimeout(() => dismissToast(id), 3200);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastMessage[] {
  return toasts;
}
