import { loadBookmarks, loadFolders, saveBookmark, saveFolder, removeBookmark, removeBookmarks, getThumbnail, saveThumbnail } from './storage';
import { getBookmarkSettings } from './settings';
import type { Bookmark, BookmarkFolder } from './types';

export const bookmarkState = {
  folders: [] as BookmarkFolder[],
  bookmarks: [] as Bookmark[],
  expandedFolderIds: new Set<string>(),
  thumbnailCache: new Map<string, string>(),
  activeFolderId: 'all',
  query: ''
};

export async function initBookmarkState() {
  const loadedFolders = await loadFolders();
  bookmarkState.folders = [
    { id: 'all', name: 'All Bookmarks', parentId: null },
    ...loadedFolders.filter(f => f.id !== 'all')
  ];
  bookmarkState.bookmarks = await loadBookmarks();
}

export function setActiveFolder(folderId: string) {
  bookmarkState.activeFolderId = folderId;
}

export function toggleFolderCollapse(folderId: string) {
  if (bookmarkState.expandedFolderIds.has(folderId)) {
    bookmarkState.expandedFolderIds.delete(folderId);
  } else {
    bookmarkState.expandedFolderIds.add(folderId);
  }
}

export function addBookmarkFolder(payload: { name: string; parentId?: string | null }) {
  const folder = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    parentId: payload.parentId ?? null
  };
  bookmarkState.folders.push(folder);
  void saveFolder(folder);
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

export async function saveThumbnailAction(id: string, dataUrl: string) {
  bookmarkState.thumbnailCache.set(id, dataUrl);
  await saveThumbnail(id, dataUrl);
}

export async function loadThumbnailAction(id: string): Promise<string | undefined> {
  if (bookmarkState.thumbnailCache.has(id)) {
    return bookmarkState.thumbnailCache.get(id);
  }
  const thumb = await getThumbnail(id);
  if (thumb) {
    bookmarkState.thumbnailCache.set(id, thumb);
  }
  return thumb;
}

export function addBookmark(payload: { title: string; url: string; folderId?: string }) {
  const settings = getBookmarkSettings();
  const fallbackFolder = settings.defaultFolderId || bookmarkState.folders.find(f => f.id !== 'all')?.id || 'all';
  const folderId = payload.folderId
    ?? (bookmarkState.activeFolderId === 'all' ? fallbackFolder : bookmarkState.activeFolderId);

  const bookmark = {
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    url: payload.url.trim(),
    folderId,
    createdAt: Date.now()
  };
  bookmarkState.bookmarks.unshift(bookmark);

  void saveBookmark(bookmark);
}

export function updateBookmark(payload: {
  id: string;
  title: string;
  url: string;
  folderId?: string;
}) {
  const bookmark = bookmarkState.bookmarks.find(b => b.id === payload.id);
  if (!bookmark) return;

  bookmark.title = payload.title.trim();
  bookmark.url = payload.url.trim();

  if (payload.folderId) {
    bookmark.folderId = payload.folderId;
  }

  void saveBookmark(bookmark);
}

export function deleteBookmarkAction(id: string) {
  bookmarkState.bookmarks = bookmarkState.bookmarks.filter(b => b.id !== id);
  void removeBookmark(id);
}

export function deleteBookmarksAction(ids: string[]) {
  const idSet = new Set(ids);
  bookmarkState.bookmarks = bookmarkState.bookmarks.filter(b => !idSet.has(b.id));
  void removeBookmarks(ids);
}

export async function generateDummyBookmarks(count: number = 50) {
  const adjectives = ['Awesome', 'Cyber', 'Neon', 'Quantum', 'Hyper', 'Super', 'Turbo', 'Mega', 'Ultra'];
  const nouns = ['Framework', 'Toolkit', 'Docs', 'Library', 'Engine', 'System', 'Hub', 'Network', 'API'];
  const domains = ['dev', 'io', 'com', 'tech', 'app', 'net'];

  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    // Choose a random folder if available, else null
    let folderId: string | undefined = undefined;
    if (bookmarkState.folders.length > 0) {
      // 20% chance of no folder
      if (Math.random() > 0.2) {
        folderId = bookmarkState.folders[Math.floor(Math.random() * bookmarkState.folders.length)].id;
      }
    }

    addBookmark({
      title: `${adj} ${noun}`,
      url: `https://${adj.toLowerCase()}${noun.toLowerCase()}.${domain}`,
      folderId
    });
  }
}
