import { FolderTreeView } from './FolderTreeView';
import { BookmarkGridView } from './BookmarkGridView';
import { BookmarkModalView } from './BookmarkModalView';
import { FolderModalView } from './FolderModalView';
import { BookmarksSettingsView } from './BookmarksSettingsView';
import { ThumbnailService } from '../services/ThumbnailService';
import { BookmarkStorageService } from '../services/BookmarkStorageService';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import { translateDOM, createLanguageSelectorComponent } from '../../../shared/services/i18n/i18n';
import type { BookmarksStore } from '../state/BookmarksStore';

/**
 * Main page view controller for the Bookmarks feature.
 * It wires up high‑level page events (scroll, resize, document clicks) and
 * composes child view controllers (grid, folder tree, modals, etc.).
 * The detailed rendering logic lives in the dedicated view classes.
 */
export class BookmarksPageView {
  constructor(
    private store: BookmarksStore,
    private thumbnailService: ThumbnailService,
    private bookmarkStorage: BookmarkStorageService,
    private settingsService = bookmarkSettingsService,
  ) { }

  /** Initialise the page – translate UI, inject language selector, and attach listeners. */
  async init(): Promise<void> {
    // Translate static DOM strings
    translateDOM();

    // Inject language selector into the settings sidebar (same location as legacy code)
    const settingsSection = document.querySelector('#bookmarks-settings-sidebar .settings-content .settings-section');
    if (settingsSection) {
      settingsSection.appendChild(createLanguageSelectorComponent());
    }

    // Register global UI listeners
    this.registerGlobalListeners();

    // Instantiate and initialise child view controllers
    const folderTree = new FolderTreeView(this.store);
    folderTree.init();
    const grid = new BookmarkGridView(this.store, this.thumbnailService);
    grid.init();
    const bookmarkModal = new BookmarkModalView(this.store, this.bookmarkStorage, this.thumbnailService);
    bookmarkModal.init();
    const folderModal = new FolderModalView(this.store);
    folderModal.init();
    const settingsView = new BookmarksSettingsView(this.store, this.settingsService, this.thumbnailService);
    settingsView.init();
  }

  private registerGlobalListeners(): void {
    const mainEl = document.querySelector('.bookmarks-main');
    const searchEl = document.getElementById('bookmark-search') as HTMLInputElement;
    if (mainEl) {
      mainEl.addEventListener('scroll', () => {
        // In a real implementation this would trigger virtualisation refresh.
        // For now we just dispatch a custom event that child views can listen to.
        mainEl.dispatchEvent(new CustomEvent('bookmarks:scroll'));
      });
    }

    window.addEventListener('resize', () => {
      document.dispatchEvent(new CustomEvent('bookmarks:resize'));
    });

    // Close any open context menus when clicking outside.
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bookmark-menu') && !target.closest('.bookmark-menu-btn')) {
        document.dispatchEvent(new CustomEvent('bookmarks:closeAllMenus'));
      }
    });

    if(searchEl) {
      searchEl.addEventListener('input', () => {
        this.store.setSearchQuery(searchEl.value.trim());
      })
    }
  }
}
