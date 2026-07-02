import { describe, expect, it } from 'vitest';
import type { Bookmark, BookmarkFolder } from '../types';
import {
  getBookmarkCountForFolder,
  getDescendantFolderIds,
  getVisibleBookmarks,
  getVisibleFolders,
  isValidBookmarkUrl,
  orderFoldersForSelect,
} from './bookmarkUtils';

const folders: BookmarkFolder[] = [
  { id: 'all', name: 'All Bookmarks', parentId: null },
  { id: 'work', name: 'Work', parentId: null },
  { id: 'docs', name: 'Docs', parentId: 'work' },
  { id: 'personal', name: 'Personal', parentId: null },
];

const bookmarks: Bookmark[] = [
  { id: '1', title: 'Vite Docs', url: 'https://vite.dev', folderId: 'docs', createdAt: 1 },
  { id: '2', title: 'GitHub', url: 'https://github.com', folderId: 'work', createdAt: 2 },
  { id: '3', title: 'Recipe', url: 'https://example.com/recipe', folderId: 'personal', createdAt: 3 },
];

describe('bookmarkUtils', () => {
  it('validates only HTTP and HTTPS URLs', () => {
    expect(isValidBookmarkUrl('https://example.com')).toBe(true);
    expect(isValidBookmarkUrl('http://example.com')).toBe(true);
    expect(isValidBookmarkUrl('ftp://example.com')).toBe(false);
    expect(isValidBookmarkUrl('not-a-url')).toBe(false);
  });

  it('returns descendant folder ids recursively', () => {
    expect(getDescendantFolderIds(folders, 'work')).toEqual(['docs']);
    expect(getDescendantFolderIds(folders, 'personal')).toEqual([]);
  });

  it('calculates recursive bookmark counts', () => {
    expect(getBookmarkCountForFolder(folders, bookmarks, 'all')).toBe(3);
    expect(getBookmarkCountForFolder(folders, bookmarks, 'work')).toBe(2);
    expect(getBookmarkCountForFolder(folders, bookmarks, 'docs')).toBe(1);
  });

  it('filters visible bookmarks by folder scope when no query is present', () => {
    expect(getVisibleBookmarks(folders, bookmarks, 'work', '').map(bookmark => bookmark.id)).toEqual(['2']);
    expect(getVisibleBookmarks(folders, bookmarks, 'all', '').map(bookmark => bookmark.id)).toEqual(['1', '2', '3']);
  });

  it('filters visible bookmarks recursively when query is present', () => {
    expect(getVisibleBookmarks(folders, bookmarks, 'work', 'vite').map(bookmark => bookmark.id)).toEqual(['1']);
    expect(getVisibleBookmarks(folders, bookmarks, 'all', 'vite').map(bookmark => bookmark.id)).toEqual(['1']);
    expect(getVisibleBookmarks(folders, bookmarks, 'personal', 'github')).toEqual([]);
  });

  it('filters visible folders depending on folder scope and query', () => {
    expect(getVisibleFolders(folders, 'all', '').map(f => f.id)).toEqual([]);
    expect(getVisibleFolders(folders, 'work', '').map(f => f.id)).toEqual(['docs']);
    expect(getVisibleFolders(folders, 'all', 'do').map(f => f.id)).toEqual([]);
    expect(getVisibleFolders(folders, 'work', 'do').map(f => f.id)).toEqual(['docs']);
  });

  it('orders folders for select inputs without the synthetic all folder', () => {
    expect(orderFoldersForSelect(folders)).toEqual([
      { id: 'work', name: 'Work', level: 0 },
      { id: 'docs', name: 'Docs', level: 1 },
      { id: 'personal', name: 'Personal', level: 0 },
    ]);
  });
});
