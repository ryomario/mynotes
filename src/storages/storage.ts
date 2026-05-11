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

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  thumbnail?: string;
  createdAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface BookmarkSettings {
  defaultFolderId: string;
  openNewBookmarkInNewTab: boolean;
  showUrlInCard: boolean;
}

export interface StorageAdapter {
  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  clearAll(): Promise<void>;
  getBookmarks(): Promise<Bookmark[]>;
  saveBookmarks(bookmarks: Bookmark[]): Promise<void>;
  getBookmarkFolders(): Promise<BookmarkFolder[]>;
  saveBookmarkFolders(folders: BookmarkFolder[]): Promise<void>;
  getBookmarkSettings(): Promise<BookmarkSettings | null>;
  saveBookmarkSettings(settings: BookmarkSettings): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  const type = import.meta.env.VITE_STORAGE_TYPE || 'localStorage';
  console.log(`Using storage adapter: ${type}`);
  if (type === 'indexedDB') {
    return new IndexedDBAdapter();
  }
  return new LocalStorageAdapter();
}
