import type { Note, Bookmark, BookmarkFolder } from '../../types';

export interface StorageService {
  // Notes Storage
  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  clearAllNotes(): Promise<void>;

  // Bookmarks Storage
  getBookmarks(): Promise<Bookmark[]>;
  saveBookmark(bookmark: Bookmark): Promise<void>;
  deleteBookmark(id: string): Promise<void>;
  deleteBookmarks(ids: string[]): Promise<void>;

  // Folders Storage
  getBookmarkFolders(): Promise<BookmarkFolder[]>;
  saveBookmarkFolder(folder: BookmarkFolder): Promise<void>;

  // Thumbnail Cache
  getThumbnail(id: string): Promise<string | undefined>;
  saveThumbnail(id: string, dataUrl: string): Promise<void>;
}
