import { IndexedDBAdapter } from "./IndexedDBAdapter";
import { LocalStorageAdapter } from "./LocalStorageAdapter";
import { ChromeApiAdapter } from "./ChromeApiAdapter";

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



export interface StorageAdapter {
  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  clearAllNotes(): Promise<void>;
  getBookmarks(): Promise<Bookmark[]>;
  deleteBookmark(id: string): Promise<void>;
  deleteBookmarks(ids: string[]): Promise<void>;
  saveBookmark(bookmark: Bookmark): Promise<void>;
  getBookmarkFolders(): Promise<BookmarkFolder[]>;
  saveBookmarkFolder(folder: BookmarkFolder): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  const type = import.meta.env.VITE_STORAGE_TYPE || 'localStorage';
  console.log(`Using storage adapter: ${type}`);
  if (type === 'indexedDB') {
    return new IndexedDBAdapter();
  }
  if (type === 'chrome-api') {
    return new ChromeApiAdapter();
  }
  return new LocalStorageAdapter();
}
