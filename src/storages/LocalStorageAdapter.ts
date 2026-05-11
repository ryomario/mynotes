import type { StorageAdapter, Note, Bookmark, BookmarkFolder, BookmarkSettings } from "./storage";

export class LocalStorageAdapter implements StorageAdapter {
    private notesKey = 'mynotes_data';
    private bookmarksKey = 'mynotes_bookmarks';
    private bookmarkFoldersKey = 'mynotes_bookmark_folders';
    private bookmarkSettingsKey = 'mynotes_bookmark_settings';

    async getNotes(): Promise<Note[]> {
        const data = localStorage.getItem(this.notesKey);
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
        localStorage.setItem(this.notesKey, JSON.stringify(notes));
    }

    async deleteNote(id: string): Promise<void> {
        const notes = await this.getNotes();
        const filtered = notes.filter(n => n.id !== id);
        localStorage.setItem(this.notesKey, JSON.stringify(filtered));
    }

    async clearAll(): Promise<void> {
        localStorage.removeItem(this.notesKey);
    }

    async getBookmarks(): Promise<Bookmark[]> {
        const data = localStorage.getItem(this.bookmarksKey);
        return data ? JSON.parse(data) : [];
    }

    async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
        localStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
    }

    async getBookmarkFolders(): Promise<BookmarkFolder[]> {
        const data = localStorage.getItem(this.bookmarkFoldersKey);
        return data ? JSON.parse(data) : [];
    }

    async saveBookmarkFolders(folders: BookmarkFolder[]): Promise<void> {
        localStorage.setItem(this.bookmarkFoldersKey, JSON.stringify(folders));
    }

    async getBookmarkSettings(): Promise<BookmarkSettings | null> {
        const data = localStorage.getItem(this.bookmarkSettingsKey);
        return data ? JSON.parse(data) : null;
    }

    async saveBookmarkSettings(settings: BookmarkSettings): Promise<void> {
        localStorage.setItem(this.bookmarkSettingsKey, JSON.stringify(settings));
    }
}
