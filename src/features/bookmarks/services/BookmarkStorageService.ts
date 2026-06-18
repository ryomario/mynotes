import type { StorageService } from '../../../shared/services/storage/StorageService';
import type { Bookmark, BookmarkFolder } from '../../../shared/types';

const defaultFolders: BookmarkFolder[] = [
  { id: 'favorites', name: 'Favorites', parentId: null },
  { id: 'work', name: 'Work', parentId: null },
];

const defaultBookmarks: Bookmark[] = [
  {
    id: 'default-mynotes-repository',
    title: 'My Notes Repository',
    url: 'https://github.com/ryomario/mynotes',
    folderId: 'work',
    createdAt: Date.now(),
  },
  {
    id: 'default-vite-documentation',
    title: 'Vite Documentation',
    url: 'https://vite.dev',
    folderId: 'favorites',
    createdAt: Date.now() - 10_000,
  },
];

export class BookmarkStorageService {
  constructor(private storage: StorageService) {}

  async loadFolders(): Promise<BookmarkFolder[]> {
    const folders = await this.storage.getBookmarkFolders();
    if (!folders || folders.length === 0) {
      await Promise.all(defaultFolders.map(folder => this.storage.saveBookmarkFolder(folder)));
      return [...defaultFolders];
    }

    return folders
      .filter(folder => folder.id !== 'all')
      .map(folder => ({ ...folder, parentId: folder.parentId ?? null }));
  }

  async loadBookmarks(): Promise<Bookmark[]> {
    const bookmarks = await this.storage.getBookmarks();
    if (!bookmarks || bookmarks.length === 0) {
      await Promise.all(defaultBookmarks.map(bookmark => this.storage.saveBookmark(bookmark)));
      return [...defaultBookmarks];
    }

    return bookmarks;
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    return this.storage.saveBookmark(bookmark);
  }

  async saveFolder(folder: BookmarkFolder): Promise<void> {
    if (folder.id === 'all') return;
    return this.storage.saveBookmarkFolder(folder);
  }

  async deleteBookmark(id: string): Promise<void> {
    return this.storage.deleteBookmark(id);
  }

  async deleteBookmarks(ids: string[]): Promise<void> {
    return this.storage.deleteBookmarks(ids);
  }

  async getThumbnail(id: string): Promise<string | undefined> {
    return this.storage.getThumbnail(id);
  }

  async saveThumbnail(id: string, dataUrl: string): Promise<void> {
    return this.storage.saveThumbnail(id, dataUrl);
  }
}
