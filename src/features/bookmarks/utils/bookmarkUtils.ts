import type { Bookmark, BookmarkFolder } from '../types';

export interface OrderedFolderOption {
  id: string;
  name: string;
  level: number;
}

export function isValidBookmarkUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getDescendantFolderIds(folders: BookmarkFolder[], folderId: string): string[] {
  const descendants: string[] = [];
  const visit = (parentId: string) => {
    folders
      .filter(folder => folder.parentId === parentId)
      .forEach(folder => {
        descendants.push(folder.id);
        visit(folder.id);
      });
  };

  visit(folderId);
  return descendants;
}

export function getBookmarkCountForFolder(
  folders: BookmarkFolder[],
  bookmarks: Bookmark[],
  folderId: string,
): number {
  if (folderId === 'all') return bookmarks.length;

  const folderIds = new Set([folderId, ...getDescendantFolderIds(folders, folderId)]);
  return bookmarks.filter(bookmark => folderIds.has(bookmark.folderId)).length;
}

export function getVisibleBookmarks(
  folders: BookmarkFolder[],
  bookmarks: Bookmark[],
  activeFolderId: string,
  query: string,
): Bookmark[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (activeFolderId === 'all') {
    if (!normalizedQuery) {
      return bookmarks;
    } else {
      return bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(normalizedQuery)
        || bookmark.url.toLowerCase().includes(normalizedQuery),
      );
    }
  } else {
    if (!normalizedQuery) {
      return bookmarks.filter(bookmark => bookmark.folderId === activeFolderId);
    } else {
      const visibleFolderIds = new Set([activeFolderId, ...getDescendantFolderIds(folders, activeFolderId)]);
      return bookmarks.filter(bookmark =>
        visibleFolderIds.has(bookmark.folderId)
        && (bookmark.title.toLowerCase().includes(normalizedQuery)
          || bookmark.url.toLowerCase().includes(normalizedQuery)),
      );
    }
  }
}

export function getVisibleFolders(
  folders: BookmarkFolder[],
  activeFolderId: string,
  query: string,
): BookmarkFolder[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (activeFolderId === 'all') {
    if (!normalizedQuery) {
      return folders.filter(f => f.id !== 'all' && !f.parentId);
    } else {
      return folders.filter(f => f.id !== 'all' && f.name.toLowerCase().includes(normalizedQuery));
    }
  } else {
    if (!normalizedQuery) {
      return folders.filter(f => f.parentId === activeFolderId);
    } else {
      const descendantIds = new Set(getDescendantFolderIds(folders, activeFolderId));
      return folders.filter(f => descendantIds.has(f.id) && f.name.toLowerCase().includes(normalizedQuery));
    }
  }
}

export function orderFoldersForSelect(folders: BookmarkFolder[]): OrderedFolderOption[] {
  const ordered: OrderedFolderOption[] = [];
  const roots = folders.filter(folder => folder.id !== 'all' && !folder.parentId);

  const visit = (folder: BookmarkFolder, level: number) => {
    ordered.push({ id: folder.id, name: folder.name, level });
    folders
      .filter(child => child.parentId === folder.id)
      .forEach(child => visit(child, level + 1));
  };

  roots.forEach(root => visit(root, 0));
  return ordered;
}

export function createDummyBookmarks(count: number, folders: BookmarkFolder[]): Bookmark[] {
  const adjectives = ['Awesome', 'Cyber', 'Neon', 'Quantum', 'Hyper', 'Super', 'Turbo', 'Mega', 'Ultra'];
  const nouns = ['Framework', 'Toolkit', 'Docs', 'Library', 'Engine', 'System', 'Hub', 'Network', 'API'];
  const domains = ['dev', 'io', 'com', 'tech', 'app', 'net'];
  const selectableFolders = folders.filter(folder => folder.id !== 'all');

  return Array.from({ length: count }, () => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const fallbackFolderId = selectableFolders[0]?.id ?? 'favorites';
    const randomFolder = selectableFolders[Math.floor(Math.random() * selectableFolders.length)];

    return {
      id: crypto.randomUUID(),
      title: `${adjective} ${noun}`,
      url: `https://${adjective.toLowerCase()}${noun.toLowerCase()}.${domain}`,
      folderId: randomFolder?.id ?? fallbackFolderId,
      createdAt: Date.now(),
    };
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
