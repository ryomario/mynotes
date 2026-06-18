import { Store } from '../../../shared/state/Store';
import type { Bookmark, BookmarkFolder } from '../../../shared/types';
import type { StorageService } from '../../../shared/services/storage/StorageService';
import { BookmarkStorageService } from '../services/BookmarkStorageService';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import { createDummyBookmarks, getVisibleBookmarks } from '../utils/bookmarkUtils';

export interface BookmarksState {
  folders: BookmarkFolder[];
  bookmarks: Bookmark[];
  expandedFolderIds: Set<string>;
  thumbnailCache: Map<string, string>;
  activeFolderId: string;
  query: string;
  selectedBookmarkIds: Set<string>;
  isSelectionMode: boolean;
  activeMenuBookmarkId: string | null;
  isLoading: boolean;
}

export class BookmarksStore extends Store<BookmarksState> {
  private bookmarkStorage: BookmarkStorageService;

  constructor(config: { storageService: StorageService; browserService?: unknown }) {
    super({
      folders: [],
      bookmarks: [],
      expandedFolderIds: new Set(),
      thumbnailCache: new Map(),
      activeFolderId: 'all',
      query: '',
      selectedBookmarkIds: new Set(),
      isSelectionMode: false,
      activeMenuBookmarkId: null,
      isLoading: false,
    });
    void config.browserService;
    this.bookmarkStorage = new BookmarkStorageService(config.storageService);
  }

  // ---- Loading ----
  async loadBookmarks(): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const [folders, bookmarks] = await Promise.all([
        this.bookmarkStorage.loadFolders(),
        this.bookmarkStorage.loadBookmarks(),
      ]);
      const syntheticAll: BookmarkFolder = { id: 'all', name: 'All Bookmarks', parentId: null };
      this.setState({
        folders: [syntheticAll, ...folders.filter(folder => folder.id !== 'all')],
        bookmarks,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      this.setState({ isLoading: false });
    }
  }

  // ---- Folder Management ----
  setActiveFolder(folderId: string): void {
    this.setState({ activeFolderId: folderId, query: '' });
  }

  toggleFolderCollapse(folderId: string): void {
    const expanded = new Set(this.state.expandedFolderIds);
    if (expanded.has(folderId)) expanded.delete(folderId);
    else expanded.add(folderId);
    this.setState({ expandedFolderIds: expanded });
  }

  async addFolder(name: string, parentId: string | null = null): Promise<BookmarkFolder> {
    const folder: BookmarkFolder = { id: crypto.randomUUID(), name: name.trim(), parentId: parentId || null };
    await this.bookmarkStorage.saveFolder(folder);
    this.setState({ folders: [...this.state.folders, folder] });
    return folder;
  }

  // ---- Search ----
  setSearchQuery(query: string): void {
    this.setState({ query: query.trim().toLowerCase() });
  }

  // ---- Bookmark CRUD ----
  async addBookmark(title: string, url: string, folderId?: string): Promise<Bookmark> {
    const settings = bookmarkSettingsService.getBookmarkSettings();
    const fallbackFolder = settings.defaultFolderId || this.state.folders.find(folder => folder.id !== 'all')?.id || 'favorites';
    const targetFolderId = folderId ?? (this.state.activeFolderId === 'all' ? fallbackFolder : this.state.activeFolderId);
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url.trim(),
      folderId: targetFolderId,
      createdAt: Date.now(),
    };
    await this.bookmarkStorage.saveBookmark(bookmark);
    this.setState({ bookmarks: [bookmark, ...this.state.bookmarks] });
    return bookmark;
  }

  async updateBookmark(id: string, title: string, url: string, folderId?: string): Promise<void> {
    const bookmark = this.state.bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    const updated: Bookmark = {
      ...bookmark,
      title: title.trim(),
      url: url.trim(),
      folderId: folderId || bookmark.folderId,
    };
    await this.bookmarkStorage.saveBookmark(updated);
    this.setState({ bookmarks: this.state.bookmarks.map(item => item.id === id ? updated : item) });
  }

  async deleteBookmark(id: string): Promise<void> {
    await this.bookmarkStorage.deleteBookmark(id);
    const selected = new Set(this.state.selectedBookmarkIds);
    selected.delete(id);
    this.setState({
      bookmarks: this.state.bookmarks.filter(b => b.id !== id),
      selectedBookmarkIds: selected,
      isSelectionMode: selected.size > 0 && this.state.isSelectionMode,
    });
  }

  async deleteBookmarks(ids: string[]): Promise<void> {
    await this.bookmarkStorage.deleteBookmarks(ids);
    const idSet = new Set(ids);
    this.setState({
      bookmarks: this.state.bookmarks.filter(b => !idSet.has(b.id)),
      selectedBookmarkIds: new Set(),
      isSelectionMode: false,
    });
  }

  // ---- Thumbnail Cache ----
  async loadThumbnail(id: string): Promise<string | undefined> {
    if (this.state.thumbnailCache.has(id)) return this.state.thumbnailCache.get(id);
    const thumb = await this.bookmarkStorage.getThumbnail(id);
    if (thumb) {
      const cache = new Map(this.state.thumbnailCache);
      cache.set(id, thumb);
      this.setState({ thumbnailCache: cache });
    }
    return thumb;
  }

  async saveThumbnail(id: string, dataUrl: string): Promise<void> {
    await this.bookmarkStorage.saveThumbnail(id, dataUrl);
    const cache = new Map(this.state.thumbnailCache);
    cache.set(id, dataUrl);
    this.setState({ thumbnailCache: cache });
  }

  // ---- UI Helpers (menu selection) ----
  setActiveMenuBookmark(id: string | null): void {
    this.setState({ activeMenuBookmarkId: id });
  }

  // ---- Selection Mode ----
  enterSelectionMode(initialId: string): void {
    const selected = new Set<string>([initialId]);
    this.setState({ isSelectionMode: true, selectedBookmarkIds: selected });
  }

  toggleBookmarkSelection(id: string): void {
    const selected = new Set(this.state.selectedBookmarkIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    this.setState({ selectedBookmarkIds: selected, isSelectionMode: selected.size > 0 });
  }

  selectAllVisible(): void {
    const visible = this.getVisibleBookmarks().map(b => b.id);
    this.setState({ selectedBookmarkIds: new Set(visible) });
  }

  clearSelection(): void {
    this.setState({ isSelectionMode: false, selectedBookmarkIds: new Set() });
  }

  // ---- Utility: visible bookmarks based on active folder and query ----
  getVisibleBookmarks(): Bookmark[] {
    return getVisibleBookmarks(this.state.folders, this.state.bookmarks, this.state.activeFolderId, this.state.query);
  }

  async generateDummyBookmarks(count: number = 50): Promise<void> {
    const bookmarks = createDummyBookmarks(count, this.state.folders);
    await Promise.all(bookmarks.map(bookmark => this.bookmarkStorage.saveBookmark(bookmark)));
    this.setState({ bookmarks: [...bookmarks, ...this.state.bookmarks] });
  }
}
