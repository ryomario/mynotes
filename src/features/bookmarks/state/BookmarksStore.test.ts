import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookmarksStore } from './BookmarksStore';
import type { StorageService } from '../../../shared/services/storage/StorageService';
import type { Bookmark, BookmarkFolder } from '../types';

const folders: BookmarkFolder[] = [
  { id: 'favorites', name: 'Favorites', parentId: null },
  { id: 'work', name: 'Work', parentId: null },
];

const bookmarks: Bookmark[] = [
  { id: '1', title: 'One', url: 'https://one.test', folderId: 'favorites', createdAt: 1 },
  { id: '2', title: 'Two', url: 'https://two.test', folderId: 'work', createdAt: 2 },
];

function createMockStorage(): StorageService {
  return {
    getNotes: vi.fn().mockResolvedValue([]),
    saveNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    clearAllNotes: vi.fn().mockResolvedValue(undefined),
    getBookmarks: vi.fn().mockResolvedValue([...bookmarks]),
    saveBookmark: vi.fn().mockResolvedValue(undefined),
    deleteBookmark: vi.fn().mockResolvedValue(undefined),
    deleteBookmarks: vi.fn().mockResolvedValue(undefined),
    getBookmarkFolders: vi.fn().mockResolvedValue([...folders]),
    saveBookmarkFolder: vi.fn().mockResolvedValue(undefined),
    getThumbnail: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
    saveThumbnail: vi.fn().mockResolvedValue(undefined),
  };
}

describe('BookmarksStore', () => {
  let storage: StorageService;
  let store: BookmarksStore;
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      clear: vi.fn(() => { store = {}; }),
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };
  })();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
    localStorage.clear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
    storage = createMockStorage();
    store = new BookmarksStore({ storageService: storage });
  });

  it('initializes with default state', () => {
    expect(store.state.activeFolderId).toBe('all');
    expect(store.state.bookmarks).toEqual([]);
    expect(store.state.isSelectionMode).toBe(false);
  });

  it('loads folders/bookmarks and inserts synthetic all folder', async () => {
    await store.loadBookmarks();
    expect(store.state.folders[0]).toEqual({ id: 'all', name: 'All Bookmarks', parentId: null });
    expect(store.state.bookmarks).toHaveLength(2);
  });

  it('sets active folder and clears query', async () => {
    await store.loadBookmarks();
    store.setSearchQuery('one');
    store.setActiveFolder('work');
    expect(store.state.activeFolderId).toBe('work');
    expect(store.state.query).toBe('');
  });

  it('clears selection mode when active folder changes', async () => {
    await store.loadBookmarks();
    store.enterSelectionMode('1');
    store.toggleBookmarkSelection('2');

    store.setActiveFolder('work');

    expect(store.state.activeFolderId).toBe('work');
    expect(store.state.isSelectionMode).toBe(false);
    expect(store.state.selectedBookmarkIds).toEqual(new Set());
  });

  it('toggles folder collapse state', () => {
    store.toggleFolderCollapse('work');
    expect(store.state.expandedFolderIds.has('work')).toBe(true);
    store.toggleFolderCollapse('work');
    expect(store.state.expandedFolderIds.has('work')).toBe(false);
  });

  it('adds, updates, and deletes a bookmark', async () => {
    await store.loadBookmarks();
    const bookmark = await store.addBookmark('New', 'https://new.test', 'work');
    expect(bookmark.id).toBe('00000000-0000-4000-8000-000000000000');
    expect(store.state.bookmarks[0].title).toBe('New');
    expect(storage.saveBookmark).toHaveBeenCalledWith(bookmark);

    await store.updateBookmark('00000000-0000-4000-8000-000000000000', 'Updated', 'https://updated.test', 'favorites');
    expect(store.state.bookmarks[0].title).toBe('Updated');

    await store.deleteBookmark('00000000-0000-4000-8000-000000000000');
    expect(store.state.bookmarks.some(item => item.id === '00000000-0000-4000-8000-000000000000')).toBe(false);
    expect(storage.deleteBookmark).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000000');
  });

  it('handles selection mode and bulk delete', async () => {
    await store.loadBookmarks();
    store.enterSelectionMode('1');
    store.toggleBookmarkSelection('2');
    expect(store.state.selectedBookmarkIds).toEqual(new Set(['1', '2']));

    await store.deleteBookmarks(['1', '2']);
    expect(store.state.bookmarks).toEqual([]);
    expect(store.state.isSelectionMode).toBe(false);
  });

  it('loads and saves thumbnail cache', async () => {
    await expect(store.loadThumbnail('1')).resolves.toBe('data:image/png;base64,abc');
    expect(store.state.thumbnailCache.get('1')).toBe('data:image/png;base64,abc');

    await store.saveThumbnail('1', 'data:image/png;base64,updated');
    expect(store.state.thumbnailCache.get('1')).toBe('data:image/png;base64,updated');
    expect(storage.saveThumbnail).toHaveBeenCalledWith('1', 'data:image/png;base64,updated');
  });
});
