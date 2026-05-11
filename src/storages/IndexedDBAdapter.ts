import type { StorageAdapter, Note, Bookmark, BookmarkFolder } from "./storage";

export class IndexedDBAdapter implements StorageAdapter {
    private dbName = 'NotesDB';
    private dbVersion = 2;
    private notesStore = 'notes';
    private bookmarksStore = 'bookmarks';
    private bookmarkFoldersStore = 'bookmark_folders';

    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.notesStore)) db.createObjectStore(this.notesStore, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(this.bookmarksStore)) db.createObjectStore(this.bookmarksStore, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(this.bookmarkFoldersStore)) db.createObjectStore(this.bookmarkFoldersStore, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getNotes(): Promise<Note[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.notesStore, 'readonly');
            const store = transaction.objectStore(this.notesStore);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveNote(note: Note): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.notesStore, 'readwrite');
            const store = transaction.objectStore(this.notesStore);
            const request = store.put(note);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNote(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.notesStore, 'readwrite');
            const store = transaction.objectStore(this.notesStore);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.notesStore, 'readwrite');
            const store = transaction.objectStore(this.notesStore);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getBookmarks(): Promise<Bookmark[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.bookmarksStore, 'readonly');
            const request = tx.objectStore(this.bookmarksStore).getAll();
            request.onsuccess = () => resolve(request.result as Bookmark[]);
            request.onerror = () => reject(request.error);
        });
    }

    async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.bookmarksStore, 'readwrite');
            const store = tx.objectStore(this.bookmarksStore);
            const clearReq = store.clear();
            clearReq.onerror = () => reject(clearReq.error);
            clearReq.onsuccess = () => {
                bookmarks.forEach(b => store.put(b));
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
        });
    }

    async getBookmarkFolders(): Promise<BookmarkFolder[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.bookmarkFoldersStore, 'readonly');
            const request = tx.objectStore(this.bookmarkFoldersStore).getAll();
            request.onsuccess = () => resolve(request.result as BookmarkFolder[]);
            request.onerror = () => reject(request.error);
        });
    }

    async saveBookmarkFolders(folders: BookmarkFolder[]): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.bookmarkFoldersStore, 'readwrite');
            const store = tx.objectStore(this.bookmarkFoldersStore);
            const clearReq = store.clear();
            clearReq.onerror = () => reject(clearReq.error);
            clearReq.onsuccess = () => {
                folders.forEach(f => store.put(f));
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
        });
    }
}
