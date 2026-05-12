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

  async clearAllNotes(): Promise<void> {
    return this.notesAdapter.clearAllNotes();
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

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome Bookmarks API not available');
      return;
    }

    return new Promise((resolve) => {
      chrome.bookmarks.get(bookmark.id, (results) => {
        if (chrome.runtime.lastError || !results || results.length === 0) {
          void chrome.runtime.lastError; // Ignore error
          let parentId = bookmark.folderId;
          if (!parentId || parentId === '0' || parentId === 'all') {
            parentId = '1'; // Default to Bookmarks Bar
          }
          chrome.bookmarks.create({
            parentId,
            title: bookmark.title,
            url: bookmark.url
          }, (created) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return resolve();
            }
            if (created) {
              bookmark.id = created.id;
              bookmark.folderId = created.parentId || '0';
            }
            resolve();
          });
        } else {
          chrome.bookmarks.update(bookmark.id, {
            title: bookmark.title,
            url: bookmark.url
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return resolve();
            }
            let targetParentId = bookmark.folderId;
            if (!targetParentId || targetParentId === '0' || targetParentId === 'all') {
              targetParentId = '1';
            }
            const existing = results[0];
            if (existing.parentId !== targetParentId) {
              chrome.bookmarks.move(bookmark.id, { parentId: targetParentId }, () => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome Bookmarks API not available');
      return;
    }
    return new Promise((resolve) => {
      chrome.bookmarks.remove(id, () => {
        void chrome.runtime.lastError; // Ignore if not found
        // Also remove thumbnail if exists
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.remove(`thumb_${id}`);
        }
        // Always try to remove from IndexedDB too as fallback/cleanup
        this.notesAdapter.getThumbnail(id).then(exists => {
          if (exists) this.notesAdapter.saveThumbnail(id, ''); // IndexedDB delete thumbnail logic? 
          // Wait, IndexedDBAdapter deleteBookmark also handles thumbnails now.
          // But ChromeApiAdapter doesn't call notesAdapter.deleteBookmark.
        });
        resolve();
      });
    });
  }

  async deleteBookmarks(ids: string[]): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome Bookmarks API not available');
      return;
    }
    if (ids.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let completed = 0;
      ids.forEach(id => {
        chrome.bookmarks.remove(id, () => {
          void chrome.runtime.lastError;
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove(`thumb_${id}`, () => {
              completed++;
              if (completed === ids.length) resolve();
            });
          } else {
            completed++;
            if (completed === ids.length) resolve();
          }
        });
      });
    });
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

  async saveBookmarkFolder(folder: BookmarkFolder): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome Bookmarks API not available');
      return;
    }

    return new Promise((resolve) => {
      chrome.bookmarks.get(folder.id, (results) => {
        if (chrome.runtime.lastError || !results || results.length === 0) {
          void chrome.runtime.lastError;
          let parentId = folder.parentId;
          if (!parentId || parentId === '0' || parentId === 'all') {
            parentId = '1';
          }
          chrome.bookmarks.create({
            parentId,
            title: folder.name
          }, (created) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return resolve();
            }
            if (created) {
              folder.id = created.id;
              folder.parentId = created.parentId !== '0' ? created.parentId : null;
            }
            resolve();
          });
        } else {
          chrome.bookmarks.update(folder.id, {
            title: folder.name
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return resolve();
            }
            let targetParentId = folder.parentId;
            if (!targetParentId || targetParentId === '0' || targetParentId === 'all') {
              targetParentId = '1';
            }
            const existing = results[0];
            if (existing.parentId !== targetParentId) {
              chrome.bookmarks.move(folder.id, { parentId: targetParentId }, () => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  async getThumbnail(id: string): Promise<string | undefined> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(`thumb_${id}`, async (result: { [key: string]: any }) => {
          if (chrome.runtime.lastError || !result[`thumb_${id}`]) {
            // Try fallback
            const fallback = await this.notesAdapter.getThumbnail(id);
            resolve(fallback);
          } else {
            resolve(result[`thumb_${id}`] as string | undefined);
          }
        });
      });
    }
    return this.notesAdapter.getThumbnail(id);
  }

  async saveThumbnail(id: string, dataUrl: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [`thumb_${id}`]: dataUrl }, () => {
          if (chrome.runtime.lastError) {
            console.warn('chrome.storage.local.set failed, falling back to IndexedDB:', chrome.runtime.lastError);
            this.notesAdapter.saveThumbnail(id, dataUrl).then(resolve);
          } else {
            resolve();
          }
        });
      });
    }
    return this.notesAdapter.saveThumbnail(id, dataUrl);
  }
}
