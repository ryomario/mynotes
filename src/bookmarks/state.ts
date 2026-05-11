import { loadBookmarks, loadFolders, saveBookmarks, saveFolders } from './storage';
import { getBookmarkSettings } from './settings';
import type { Bookmark, BookmarkFolder } from './types';

export const bookmarkState = {
  folders: [] as BookmarkFolder[],
  bookmarks: [] as Bookmark[],
  collapsedFolderIds: new Set<string>(),
  activeFolderId: 'all',
  query: ''
};

export async function initBookmarkState() {
  bookmarkState.folders = await loadFolders();
  bookmarkState.bookmarks = await loadBookmarks();
}

export function setActiveFolder(folderId: string) {
  bookmarkState.activeFolderId = folderId;
}

export function toggleFolderCollapse(folderId: string) {
  if (bookmarkState.collapsedFolderIds.has(folderId)) {
    bookmarkState.collapsedFolderIds.delete(folderId);
  } else {
    bookmarkState.collapsedFolderIds.add(folderId);
  }
}

export function addBookmarkFolder(payload: { name: string; parentId?: string | null }) {
  const folder = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    parentId: payload.parentId ?? null
  };
  bookmarkState.folders.push(folder);
  void saveFolders(bookmarkState.folders);
  return folder;
}

export function setSearchQuery(query: string) {
  bookmarkState.query = query.trim().toLowerCase();
}

export function getVisibleBookmarks(): Bookmark[] {
  const byFolder = bookmarkState.activeFolderId === 'all'
    ? bookmarkState.bookmarks
    : bookmarkState.bookmarks.filter(b => b.folderId === bookmarkState.activeFolderId);

  if (!bookmarkState.query) return byFolder;

  return byFolder.filter(b =>
    b.title.toLowerCase().includes(bookmarkState.query)
    || b.url.toLowerCase().includes(bookmarkState.query)
  );
}

export function updateBookmarkThumbnail(id: string, thumbnail: string) {
  const bookmark = bookmarkState.bookmarks.find(b => b.id === id);
  if (!bookmark) return;
  bookmark.thumbnail = thumbnail;
  void saveBookmarks(bookmarkState.bookmarks);
}

export function addBookmark(payload: { title: string; url: string; thumbnail?: string; folderId?: string }) {
  const settings = getBookmarkSettings();
  const fallbackFolder = settings.defaultFolderId || bookmarkState.folders.find(f => f.id !== 'all')?.id || 'all';
  const folderId = payload.folderId
    ?? (bookmarkState.activeFolderId === 'all' ? fallbackFolder : bookmarkState.activeFolderId);

  bookmarkState.bookmarks.unshift({
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    url: payload.url.trim(),
    folderId,
    thumbnail: payload.thumbnail,
    createdAt: Date.now()
  });

  void saveBookmarks(bookmarkState.bookmarks);
}

export function updateBookmark(payload: {
  id: string;
  title: string;
  url: string;
  folderId?: string;
  thumbnail?: string;
  keepExistingThumbnail?: boolean;
}) {
  const bookmark = bookmarkState.bookmarks.find(b => b.id === payload.id);
  if (!bookmark) return;

  bookmark.title = payload.title.trim();
  bookmark.url = payload.url.trim();

  if (payload.folderId) {
    bookmark.folderId = payload.folderId;
  }

  if (payload.keepExistingThumbnail) {
    // no-op
  } else {
    bookmark.thumbnail = payload.thumbnail;
  }

  void saveBookmarks(bookmarkState.bookmarks);
}
