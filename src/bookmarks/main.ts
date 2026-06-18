import { getStorageService } from '../shared/services/storage/storageFactory';
import { getBrowserService } from '../shared/services/browser/browserFactory';
import { BookmarksPageView, BookmarksStore, BookmarkStorageService, ThumbnailService } from '../features/bookmarks';

/** Bootstrap the Bookmarks feature using the new modular architecture */
async function init(): Promise<void> {
  // Translation and language selector (still needed for static strings)
  const { translateDOM } = await import('../utils/i18n');
  translateDOM();

  // Core services & store
  const storage = getStorageService();
  const browser = getBrowserService();
  const store = new BookmarksStore({ storageService: storage, browserService: browser });
  await store.loadBookmarks();
  const bookmarkStorage = new BookmarkStorageService(storage);
  const thumbnailService = new ThumbnailService(browser, storage);

  // Initialise the page view which wires UI to the store and services
  const pageView = new BookmarksPageView(store, thumbnailService, bookmarkStorage);
  await pageView.init();
}

void init();
