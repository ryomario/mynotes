import { IndexedDBAdapter } from "./IndexedDBAdapter";
import type { StorageAdapter, Note, Bookmark, BookmarkFolder } from "./storage";

export class ChromeApiAdapter implements StorageAdapter {
  private notesAdapter = new IndexedDBAdapter();

  // Notes: use IndexedDB
  async getNotes(): Promise<Note[]> {
    return this.notesAdapter.getNotes();
  }

  async saveNote(note: Note): Promise<void> {
    return this.notesAdapter.saveNote(note);
  }

  async deleteNote(id: string): Promise<void> {
    return this.notesAdapter.deleteNote(id);
  }

  async clearAll(): Promise<void> {
    return this.notesAdapter.clearAll();
  }

  // Bookmarks: use chrome.bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome Bookmarks API not available');
      return [];
    }

    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const bookmarks: Bookmark[] = [];
        const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
          for (const node of nodes) {
            if (node.url) {
              bookmarks.push({
                id: node.id,
                title: node.title,
                url: node.url,
                folderId: node.parentId || '0',
                createdAt: node.dateAdded || Date.now()
              });
            }
            if (node.children) traverse(node.children);
          }
        };
        traverse(tree);
        resolve(bookmarks);
      });
    });
  }

  async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    // Note: chrome.bookmarks API is granular. 
    // Implementing a full sync from a flat array back to a tree is complex.
    // For now, we assume getBookmarks is the source of truth.
    console.log('saveBookmarks called on ChromeApiAdapter', bookmarks);
  }

  async getBookmarkFolders(): Promise<BookmarkFolder[]> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      return [];
    }

    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const folders: BookmarkFolder[] = [];
        const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
          for (const node of nodes) {
            if (!node.url && node.id != '0') {
              folders.push({
                id: node.id,
                name: node.title || 'Root',
                parentId: node.parentId != '0' ? node.parentId : null
              });
            }
            if (node.children) traverse(node.children);
          }
        };
        traverse(tree);
        resolve(folders);
      });
    });
  }

  async saveBookmarkFolders(folders: BookmarkFolder[]): Promise<void> {
    console.log('saveBookmarkFolders called on ChromeApiAdapter', folders);
  }
}
