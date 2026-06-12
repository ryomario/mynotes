import type { StorageService } from './StorageService';
import type { Note, Bookmark, BookmarkFolder } from '../../types';

export class IndexedDBStorageService implements StorageService {
  private dbName = 'NotesDB';
  private dbVersion = 3;
  private notesStore = 'notes';
  private bookmarksStore = 'bookmarks';
  private bookmarkFoldersStore = 'bookmark_folders';
  private bookmarkThumbnailsStore = 'bookmark_thumbnails';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.notesStore)) db.createObjectStore(this.notesStore, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(this.bookmarksStore)) db.createObjectStore(this.bookmarksStore, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(this.bookmarkFoldersStore)) db.createObjectStore(this.bookmarkFoldersStore, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(this.bookmarkThumbnailsStore)) db.createObjectStore(this.bookmarkThumbnailsStore, { keyPath: 'id' });
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

  async clearAllNotes(): Promise<void> {
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

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.bookmarksStore, 'readwrite');
      const store = tx.objectStore(this.bookmarksStore);
      const request = store.put(bookmark);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.bookmarksStore, this.bookmarkThumbnailsStore], 'readwrite');
      const store = transaction.objectStore(this.bookmarksStore);
      const thumbStore = transaction.objectStore(this.bookmarkThumbnailsStore);

      const request = store.delete(id);
      request.onsuccess = () => {
        thumbStore.delete(id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBookmarks(ids: string[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.bookmarksStore, this.bookmarkThumbnailsStore], 'readwrite');
      const store = transaction.objectStore(this.bookmarksStore);
      const thumbStore = transaction.objectStore(this.bookmarkThumbnailsStore);
      let errors = 0;
      let completed = 0;
      if (ids.length === 0) return resolve();

      ids.forEach(id => {
        const request = store.delete(id);
        request.onsuccess = () => {
          thumbStore.delete(id);
          completed++;
          if (completed === ids.length) resolve();
        };
        request.onerror = () => {
          errors++;
          if (errors + completed === ids.length) reject(request.error);
        };
      });
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

  async saveBookmarkFolder(folder: BookmarkFolder): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.bookmarkFoldersStore, 'readwrite');
      const store = tx.objectStore(this.bookmarkFoldersStore);
      const request = store.put(folder);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getThumbnail(id: string): Promise<string | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.bookmarkThumbnailsStore, 'readonly');
      const store = tx.objectStore(this.bookmarkThumbnailsStore);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ? request.result.data : undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async saveThumbnail(id: string, dataUrl: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.bookmarkThumbnailsStore, 'readwrite');
      const store = tx.objectStore(this.bookmarkThumbnailsStore);
      const request = store.put({ id, data: dataUrl });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
