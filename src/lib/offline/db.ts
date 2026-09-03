import Dexie, { type Table } from "dexie";

// File d'attente d'écriture offline : une action = un appel de Server
// Action différé (module + nom de fonction + arguments), rejoué dans
// l'ordre à la reconnexion par flushQueue() (voir queue.ts).
export type PendingAction = {
  id?: number;
  module: string;
  action_name: string;
  payload: unknown[];
  created_at: string;
};

class OfflineDB extends Dexie {
  pending_actions!: Table<PendingAction, number>;

  constructor() {
    super("kilio-offline");
    this.version(1).stores({
      pending_actions: "++id, created_at",
    });
  }
}

export const db = new OfflineDB();
