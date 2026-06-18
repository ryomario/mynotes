import type { BookmarksStore } from '../state/BookmarksStore';
import type { BookmarkStorageService } from '../services/BookmarkStorageService';
import type { ThumbnailService } from '../services/ThumbnailService';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import { fileToDataUrl, isValidBookmarkUrl, orderFoldersForSelect } from '../utils/bookmarkUtils';
import { t } from '../../../utils/i18n';

export class BookmarkModalView {
  private modalBackdrop = document.getElementById('bookmark-modal-backdrop') as HTMLElement | null;
  private modalCloseBtn = document.getElementById('bookmark-modal-close') as HTMLButtonElement | null;
  private modalCancelBtn = document.getElementById('bookmark-cancel-btn') as HTMLButtonElement | null;
  private form = document.getElementById('bookmark-form') as HTMLFormElement | null;
  private titleInput = document.getElementById('bookmark-title-input') as HTMLInputElement | null;
  private urlInput = document.getElementById('bookmark-url-input') as HTMLInputElement | null;
  private thumbInput = document.getElementById('bookmark-thumb-input') as HTMLInputElement | null;
  private folderInput = document.getElementById('bookmark-folder-input') as HTMLSelectElement | null;
  private modalTitle = document.getElementById('bookmark-modal-title') as HTMLElement | null;
  private mode: 'create' | 'edit' = 'create';
  private editingBookmarkId: string | null = null;

  constructor(
    private store: BookmarksStore,
    private storageService: BookmarkStorageService,
    private thumbnailService: ThumbnailService,
  ) {}

  init(): void {
    void this.storageService;
    void this.thumbnailService;
    this.store.subscribe(() => this.renderFolderOptions());
    document.addEventListener('bookmarks:openBookmarkModal', (event) => {
      const detail = (event as CustomEvent<{ mode?: 'create' | 'edit'; bookmarkId?: string }>).detail;
      this.open(detail?.mode ?? 'create', detail?.bookmarkId);
    });
    this.modalBackdrop?.addEventListener('click', (event) => {
      if (event.target === this.modalBackdrop) this.close();
    });
    this.modalCloseBtn?.addEventListener('click', () => this.close());
    this.modalCancelBtn?.addEventListener('click', () => this.close());
    this.form?.addEventListener('submit', (event) => void this.handleSubmit(event));
  }

  private renderFolderOptions(): void {
    if (!this.folderInput) return;
    const selected = this.folderInput.value;
    this.folderInput.innerHTML = '';
    orderFoldersForSelect(this.store.state.folders).forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = `${'-'.repeat(folder.level)}${folder.level > 0 ? ' ' : ''}${folder.name}`;
      this.folderInput?.appendChild(option);
    });

    const fallback = bookmarkSettingsService.getBookmarkSettings().defaultFolderId
      || this.store.state.folders.find(folder => folder.id !== 'all')?.id
      || '';
    this.folderInput.value = selected || fallback;
  }

  private open(mode: 'create' | 'edit' = 'create', bookmarkId?: string): void {
    if (!this.modalBackdrop || !this.form || !this.titleInput || !this.urlInput || !this.folderInput) return;
    this.mode = mode;
    this.editingBookmarkId = bookmarkId ?? null;
    this.form.reset();
    this.renderFolderOptions();

    if (mode === 'edit' && bookmarkId) {
      const bookmark = this.store.state.bookmarks.find(item => item.id === bookmarkId);
      if (bookmark) {
        this.titleInput.value = bookmark.title;
        this.urlInput.value = bookmark.url;
        this.folderInput.value = bookmark.folderId;
        if (this.modalTitle) this.modalTitle.textContent = 'Edit Bookmark';
      }
    } else {
      if (this.modalTitle) this.modalTitle.textContent = t('add_bookmark_title');
      const defaultFolderId = bookmarkSettingsService.getBookmarkSettings().defaultFolderId
        || this.store.state.folders.find(folder => folder.id !== 'all')?.id
        || '';
      if (defaultFolderId) this.folderInput.value = defaultFolderId;
    }

    this.modalBackdrop.hidden = false;
    this.titleInput.focus();
  }

  private close(): void {
    if (!this.modalBackdrop || !this.form || !this.urlInput) return;
    this.modalBackdrop.hidden = true;
    this.form.reset();
    this.urlInput.setCustomValidity('');
    this.mode = 'create';
    this.editingBookmarkId = null;
    if (this.modalTitle) this.modalTitle.textContent = t('add_bookmark_title');
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.titleInput || !this.urlInput || !this.folderInput) return;

    const title = this.titleInput.value.trim();
    const url = this.urlInput.value.trim();
    if (!title || !url) return;
    if (!isValidBookmarkUrl(url)) {
      this.urlInput.setCustomValidity('URL tidak valid. Gunakan format https://domain.com');
      this.urlInput.reportValidity();
      return;
    }
    this.urlInput.setCustomValidity('');

    const thumbnailFile = this.thumbInput?.files?.[0];
    const folderId = this.folderInput.value || undefined;

    if (this.mode === 'edit' && this.editingBookmarkId) {
      await this.store.updateBookmark(this.editingBookmarkId, title, url, folderId);
      if (thumbnailFile) await this.store.saveThumbnail(this.editingBookmarkId, await fileToDataUrl(thumbnailFile));
    } else {
      const bookmark = await this.store.addBookmark(title, url, folderId);
      if (thumbnailFile) await this.store.saveThumbnail(bookmark.id, await fileToDataUrl(thumbnailFile));
    }

    this.close();
  }
}
