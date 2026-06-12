import type { Bookmark, BookmarkFolder } from '../shared/types';
import { getStorageService } from '../shared/services/storage/storageFactory';

const storage = getStorageService();

const defaultFolders: BookmarkFolder[] = [
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
    for (const folder of defaultFolders) {
      await storage.saveBookmarkFolder(folder);
    }
    return defaultFolders;
  }

  const normalized = parsed
    .filter(f => f.id !== 'all')
    .map(folder => ({
      ...folder,
      parentId: folder.parentId ?? null
    }));

  return normalized;
}

export async function saveFolder(folder: BookmarkFolder) {
  if (folder.id === 'all') return;
  await storage.saveBookmarkFolder(folder);
}

export async function loadBookmarks(): Promise<Bookmark[]> {
  const parsed = await storage.getBookmarks();
  if (!parsed || parsed.length === 0) {
    for (const bookmark of defaultBookmarks) {
      await storage.saveBookmark(bookmark);
    }
    return defaultBookmarks;
  }
  return parsed;
}

export async function saveBookmark(bookmark: Bookmark) {
  await storage.saveBookmark(bookmark);
}

export async function removeBookmark(id: string) {
  await storage.deleteBookmark(id);
}

export async function removeBookmarks(ids: string[]) {
  await storage.deleteBookmarks(ids);
}

export async function getThumbnail(id: string): Promise<string | undefined> {
  return await storage.getThumbnail(id);
}

export async function saveThumbnail(id: string, dataUrl: string): Promise<void> {
  await storage.saveThumbnail(id, dataUrl);
}
