import type { Bookmark, BookmarkFolder, BookmarkSettings } from './types';
import { getStorageAdapter } from '../storages/storage';

const storage = getStorageAdapter();

const defaultFolders: BookmarkFolder[] = [
  { id: 'all', name: 'All Bookmarks', parentId: null },
  { id: 'favorites', name: 'Favorites', parentId: null },
  { id: 'work', name: 'Work', parentId: null }
];

const defaultBookmarks: Bookmark[] = [
  {
    id: crypto.randomUUID(),
    title: 'My Notes Repository',
    url: 'https://github.com/ryomario/mynotes',
    folderId: 'work',
    createdAt: Date.now()
  },
  {
    id: crypto.randomUUID(),
    title: 'Vite Documentation',
    url: 'https://vite.dev',
    folderId: 'favorites',
    createdAt: Date.now() - 10_000
  }
];

export async function loadFolders(): Promise<BookmarkFolder[]> {
  const parsed = await storage.getBookmarkFolders();
  if (!parsed || parsed.length === 0) {
    await storage.saveBookmarkFolders(defaultFolders);
    return defaultFolders;
  }

  const normalized = parsed.map(folder => ({
    ...folder,
    parentId: folder.id === 'all' ? null : (folder.parentId ?? null)
  }));
  const hasAll = normalized.some(f => f.id === 'all');
  const finalFolders = hasAll ? normalized : [defaultFolders[0], ...normalized];
  await storage.saveBookmarkFolders(finalFolders);
  return finalFolders;
}

export async function saveFolders(folders: BookmarkFolder[]) {
  await storage.saveBookmarkFolders(folders);
}

export async function loadBookmarks(): Promise<Bookmark[]> {
  const parsed = await storage.getBookmarks();
  if (!parsed || parsed.length === 0) {
    await storage.saveBookmarks(defaultBookmarks);
    return defaultBookmarks;
  }
  return parsed;
}

export async function saveBookmarks(bookmarks: Bookmark[]) {
  await storage.saveBookmarks(bookmarks);
}

export function getDefaultBookmarkSettings(folders: BookmarkFolder[]): BookmarkSettings {
  const firstFolder = folders.find(f => f.id !== 'all')?.id ?? 'all';
  return {
    defaultFolderId: firstFolder,
    openNewBookmarkInNewTab: true,
    showUrlInCard: true
  };
}

export async function loadBookmarkSettings(folders: BookmarkFolder[]): Promise<BookmarkSettings> {
  const fallback = getDefaultBookmarkSettings(folders);
  const parsed = await storage.getBookmarkSettings();
  if (!parsed) {
    await storage.saveBookmarkSettings(fallback);
    return fallback;
  }

  const hasFolder = folders.some(f => f.id === parsed.defaultFolderId && f.id !== 'all');
  const settings: BookmarkSettings = {
    defaultFolderId: hasFolder ? parsed.defaultFolderId : fallback.defaultFolderId,
    openNewBookmarkInNewTab: parsed.openNewBookmarkInNewTab ?? true,
    showUrlInCard: parsed.showUrlInCard ?? true
  };
  await storage.saveBookmarkSettings(settings);
  return settings;
}

export async function saveBookmarkSettings(settings: BookmarkSettings) {
  await storage.saveBookmarkSettings(settings);
}
