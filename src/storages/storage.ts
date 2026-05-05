import { IndexedDBAdapter } from "./IndexedDBAdapter";
import { LocalStorageAdapter } from "./LocalStorageAdapter";

export interface Note {
  id: string;
  content: string;
  updatedAt: number;
  pinned?: boolean;
  locked?: boolean;
  order?: number;
}

export interface StorageAdapter {
  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  const type = import.meta.env.VITE_STORAGE_TYPE || 'localStorage';
  console.log(`Using storage adapter: ${type}`);
  if (type === 'indexedDB') {
    return new IndexedDBAdapter();
  }
  return new LocalStorageAdapter();
}
