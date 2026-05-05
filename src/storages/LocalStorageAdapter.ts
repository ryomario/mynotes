import type { StorageAdapter, Note } from "./storage";

export class LocalStorageAdapter implements StorageAdapter {
    private key = 'mynotes_data';

    async getNotes(): Promise<Note[]> {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    async saveNote(note: Note): Promise<void> {
        const notes = await this.getNotes();
        const index = notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            notes[index] = note;
        } else {
            notes.push(note);
        }
        localStorage.setItem(this.key, JSON.stringify(notes));
    }

    async deleteNote(id: string): Promise<void> {
        const notes = await this.getNotes();
        const filtered = notes.filter(n => n.id !== id);
        localStorage.setItem(this.key, JSON.stringify(filtered));
    }
}
