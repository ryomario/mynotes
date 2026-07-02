import type { StorageService } from './StorageService';
import type { Note, Bookmark, BookmarkFolder } from '../../types';

export class LocalStorageStorageService implements StorageService {
  private notesKey = 'mynotes_data';
  private bookmarksKey = 'mynotes_bookmarks';
  private bookmarkFoldersKey = 'mynotes_bookmark_folders';

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

  async clearAllNotes(): Promise<void> {
    localStorage.removeItem(this.notesKey);
  }

  async getBookmarks(): Promise<Bookmark[]> {
    const data = localStorage.getItem(this.bookmarksKey);
    return data ? JSON.parse(data) : [];
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    const bookmarks = await this.getBookmarks();
    const index = bookmarks.findIndex(b => b.id === bookmark.id);
    if (index !== -1) {
      bookmarks[index] = bookmark;
    } else {
      bookmarks.push(bookmark);
    }
    localStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
  }

  async deleteBookmark(id: string): Promise<void> {
    const bookmarks = await this.getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(this.bookmarksKey, JSON.stringify(filtered));
  }

  async deleteBookmarks(ids: string[]): Promise<void> {
    const bookmarks = await this.getBookmarks();
    const idSet = new Set(ids);
    const filtered = bookmarks.filter(b => !idSet.has(b.id));
    localStorage.setItem(this.bookmarksKey, JSON.stringify(filtered));
  }

  async getBookmarkFolders(): Promise<BookmarkFolder[]> {
    const data = localStorage.getItem(this.bookmarkFoldersKey);
    return data ? JSON.parse(data) : [];
  }

  async saveBookmarkFolder(folder: BookmarkFolder): Promise<void> {
    const folders = await this.getBookmarkFolders();
    const index = folders.findIndex(f => f.id === folder.id);
    if (index !== -1) {
      folders[index] = folder;
    } else {
      folders.push(folder);
    }
    localStorage.setItem(this.bookmarkFoldersKey, JSON.stringify(folders));
  }

  async deleteBookmarkFolder(id: string): Promise<void> {
    const folders = await this.getBookmarkFolders();
    const descendantIds: string[] = [];
    const collect = (parentId: string) => {
      folders
        .filter(f => f.parentId === parentId)
        .forEach(f => {
          descendantIds.push(f.id);
          collect(f.id);
        });
    };
    collect(id);
    const idsToDelete = [id, ...descendantIds];

    const filteredFolders = folders.filter(f => !idsToDelete.includes(f.id));
    localStorage.setItem(this.bookmarkFoldersKey, JSON.stringify(filteredFolders));

    const bookmarks = await this.getBookmarks();
    const filteredBookmarks = bookmarks.filter(b => !idsToDelete.includes(b.folderId));
    localStorage.setItem(this.bookmarksKey, JSON.stringify(filteredBookmarks));
  }

  async getThumbnail(): Promise<string | undefined> {
    return undefined;
  }

  async saveThumbnail(): Promise<void> {
    // Do nothing for localStorage to avoid hitting storage limits
  }
}
