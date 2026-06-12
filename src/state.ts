import { getStorageService } from './shared/services/storage/storageFactory';
import type { Note } from './shared/types';

const storage = getStorageService();

export const state = {
  notes: [] as Note[],
  activeNoteId: null as string | null,
  activeDropdownId: null as string | null,
  draggedItemId: null as string | null,
};

export async function initNotes(): Promise<void> {
  state.notes = await storage.getNotes();
}

export async function saveNote(note: Note): Promise<void> {
  await storage.saveNote(note);
}

export async function deleteNote(id: string): Promise<void> {
  await storage.deleteNote(id);
  state.notes = state.notes.filter(n => n.id !== id);
}

export async function clearAllNotes(): Promise<void> {
  await storage.clearAllNotes();
  state.notes = [];
}

export async function getNotesFromStorage(): Promise<Note[]> {
  return await storage.getNotes();
}
