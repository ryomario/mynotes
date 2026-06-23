import type { BookmarksStore } from '../state/BookmarksStore';
import type { ThumbnailService } from '../services/ThumbnailService';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import type { Bookmark, BookmarkFolder } from '../types';
import { fileToDataUrl, getBookmarkCountForFolder } from '../utils/bookmarkUtils';
import { t } from '../../../shared/services/i18n/i18n';

export class BookmarkGridView {
  private gridEl = document.getElementById('bookmarks-grid') as HTMLElement | null;
  private mainEl = document.querySelector('.bookmarks-main') as HTMLElement | null;
  private thumbnailInput = document.getElementById('thumbnail-input') as HTMLInputElement | null;
  private thumbnailTargetId: string | null = null;

  constructor(private store: BookmarksStore, private thumbnailService: ThumbnailService) {}

  init(): void {
    this.store.subscribe(() => this.render());
    this.mainEl?.addEventListener('scroll', () => this.render());
    window.addEventListener('resize', () => this.render());
    document.addEventListener('bookmarks:settingsChanged', () => this.render());
    document.addEventListener('bookmarks:closeAllMenus', () => this.closeAllMenus());
    document.addEventListener('bookmarks:openBookmarkModal', (event) => {
      const detail = (event as CustomEvent<{ mode: 'create' | 'edit'; bookmarkId?: string }>).detail;
      void detail;
    });
    this.thumbnailInput?.addEventListener('change', () => void this.handleThumbnailUpload());
  }

  private render(): void {
    if (!this.gridEl || !this.mainEl) return;

    const visibleBookmarks = this.store.getVisibleBookmarks();
    const visibleFolders = this.store.getVisibleFolders();
    const settings = bookmarkSettingsService.getBookmarkSettings();
    const containerWidth = this.gridEl.clientWidth || this.mainEl.clientWidth;
    const itemMinWidth = 230;
    const gap = 16;
    const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
    const itemWidth = (containerWidth - (columns - 1) * gap) / columns;
    const showUrl = settings.showUrlInCard ?? true;
    const itemHeight = showUrl ? 200 : 174;

    this.renderSelectionToolbar(visibleBookmarks);

    const scrollTop = this.mainEl.scrollTop;
    const viewportHeight = this.mainEl.clientHeight;
    const totalItems = visibleBookmarks.length + visibleFolders.length + 1;
    const totalRows = Math.ceil(totalItems / columns);
    const totalHeight = Math.max(itemHeight, totalRows * (itemHeight + gap) - gap);

    this.gridEl.style.height = `${totalHeight}px`;
    this.gridEl.innerHTML = '';

    const startRow = Math.max(0, Math.floor((scrollTop - 100) / (itemHeight + gap)));
    const endRow = Math.ceil((scrollTop + viewportHeight + 100) / (itemHeight + gap));
    const startIndex = startRow * columns;
    const endIndex = Math.min(totalItems, endRow * columns);

    for (let i = startIndex; i < endIndex; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const card = document.createElement('article');
      card.className = 'bookmark-card';
      card.style.position = 'absolute';
      card.style.width = `${itemWidth}px`;
      card.style.height = `${itemHeight}px`;
      card.style.left = `${col * (itemWidth + gap)}px`;
      card.style.top = `${row * (itemHeight + gap)}px`;

      if (i === 0) {
        this.renderAddCard(card);
      } else if (i <= visibleFolders.length) {
        this.renderFolderCard(card, visibleFolders[i - 1], showUrl);
      } else {
        this.renderBookmarkCard(card, visibleBookmarks[i - 1 - visibleFolders.length], showUrl);
      }

      this.gridEl.appendChild(card);
    }

    if (visibleBookmarks.length === 0 && visibleFolders.length === 0 && startIndex === 0) {
      const empty = document.createElement('div');
      empty.className = 'bookmarks-empty';
      empty.textContent = t('no_bookmarks_found');
      this.gridEl.appendChild(empty);
    }
  }

  private renderFolderCard(card: HTMLElement, folder: BookmarkFolder, showUrl: boolean): void {
    card.classList.add('folder-card');
    card.innerHTML = `
      <div class="bookmark-card-link" style="cursor: pointer;">
        <div class="bookmark-thumb placeholder folder-grid-thumb" style="color: var(--accent);">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="currentColor" d="M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10Z"/>
          </svg>
        </div>
        <div class="bookmark-meta">
          <h3 class="${showUrl ? '' : 'no-url'}">${folder.name}</h3>
          ${showUrl ? `<p>${t('folder_item_count', { count: String(getBookmarkCountForFolder(this.store.state.folders, this.store.state.bookmarks, folder.id)) })}</p>` : ''}
        </div>
      </div>
    `;

    card.querySelector('.bookmark-card-link')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.store.setActiveFolder(folder.id);
      const searchEl = document.getElementById('bookmark-search') as HTMLInputElement | null;
      if (searchEl) searchEl.value = '';
      document.querySelector('.bookmarks-main')?.scrollTo({ top: 0 });
    });
  }

  private renderSelectionToolbar(visible: Bookmark[]): void {
    const toolbarEl = document.querySelector('.bookmarks-toolbar');
    if (!toolbarEl) return;

    let selectionUI = toolbarEl.querySelector('.selection-ui') as HTMLElement | null;
    if (!this.store.state.isSelectionMode) {
      selectionUI?.remove();
      return;
    }

    if (!selectionUI) {
      selectionUI = document.createElement('div');
      selectionUI.className = 'selection-ui';
      toolbarEl.appendChild(selectionUI);
    }

    const selectedCount = this.store.state.selectedBookmarkIds.size;
    const allSelected = visible.length > 0 && selectedCount === visible.length;
    selectionUI.innerHTML = `
      <span class="selection-count">${t('selected_count', { count: String(selectedCount) })}</span>
      <button class="btn-action select-all-btn">${allSelected ? t('deselect_all') : t('select_all')}</button>
      <button class="btn-action primary delete-selected-btn" style="background: #ef4444; color: white;">${t('delete_selected')}</button>
      <button class="btn-action cancel-selection-btn">${t('cancel_btn')}</button>
    `;
    selectionUI.querySelector('.select-all-btn')?.addEventListener('click', () => {
      if (allSelected) this.store.clearSelection();
      else this.store.selectAllVisible();
    });
    selectionUI.querySelector('.cancel-selection-btn')?.addEventListener('click', () => this.store.clearSelection());
    selectionUI.querySelector('.delete-selected-btn')?.addEventListener('click', () => {
      if (selectedCount > 0 && confirm(t('delete_multiple_confirm', { count: String(selectedCount) }))) {
        void this.store.deleteBookmarks(Array.from(this.store.state.selectedBookmarkIds));
      }
    });
  }

  private renderAddCard(card: HTMLElement): void {
    card.className += ' bookmark-add-card';
    card.innerHTML = `
      <button class="bookmark-add-btn" type="button">
        <span class="bookmark-add-icon">&plus;</span>
        <span>${t('add_bookmark_title')}</span>
      </button>
    `;
    card.querySelector('.bookmark-add-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('bookmarks:openBookmarkModal', { detail: { mode: 'create' } }));
    });
  }

  private renderBookmarkCard(card: HTMLElement, bookmark: Bookmark, showUrl: boolean): void {
    const settings = bookmarkSettingsService.getBookmarkSettings();
    const targetAttr = settings.openNewBookmarkInNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';
    card.classList.toggle('selected', this.store.state.selectedBookmarkIds.has(bookmark.id));
    card.innerHTML = `
      <a class="bookmark-card-link" href="${bookmark.url}" ${targetAttr}>
        <div class="bookmark-meta">
          <h3 class="${showUrl ? '' : 'no-url'}">${bookmark.title}</h3>
          ${showUrl ? `<p>${bookmark.url}</p>` : ''}
        </div>
      </a>
      <button class="bookmark-menu-btn" title="Bookmark actions">⋮</button>
      <div class="bookmark-menu ${this.store.state.activeMenuBookmarkId === bookmark.id ? 'show' : ''}">
        <button class="bookmark-menu-item select-bookmark">${t('menu_select')}</button>
        <button class="bookmark-menu-item edit-bookmark">${t('menu_edit')}</button>
        <button class="bookmark-menu-item gen-thumb">${t('menu_gen_thumb')}</button>
        <button class="bookmark-menu-item upload-thumb">${t('menu_change_thumb')}</button>
        <button class="bookmark-menu-item delete-bookmark" style="color: #ef4444;">${t('menu_delete')}</button>
      </div>
    `;

    const link = card.querySelector('.bookmark-card-link') as HTMLAnchorElement;
    this.renderThumbnail(link, bookmark);
    if (this.store.state.isSelectionMode) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.store.toggleBookmarkSelection(bookmark.id);
      });
    }

    card.querySelector('.bookmark-menu-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.store.setActiveMenuBookmark(this.store.state.activeMenuBookmarkId === bookmark.id ? null : bookmark.id);
    });
    card.querySelector('.edit-bookmark')?.addEventListener('click', () => {
      this.store.setActiveMenuBookmark(null);
      document.dispatchEvent(new CustomEvent('bookmarks:openBookmarkModal', { detail: { mode: 'edit', bookmarkId: bookmark.id } }));
    });
    card.querySelector('.upload-thumb')?.addEventListener('click', () => {
      this.thumbnailTargetId = bookmark.id;
      this.store.setActiveMenuBookmark(null);
      this.thumbnailInput?.click();
    });
    card.querySelector('.gen-thumb')?.addEventListener('click', () => void this.generateThumbnail(bookmark));
    card.querySelector('.select-bookmark')?.addEventListener('click', () => {
      this.store.setActiveMenuBookmark(null);
      this.store.enterSelectionMode(bookmark.id);
    });
    card.querySelector('.delete-bookmark')?.addEventListener('click', () => {
      this.store.setActiveMenuBookmark(null);
      if (confirm(t('delete_bookmark_confirm'))) void this.store.deleteBookmark(bookmark.id);
    });
  }

  private renderThumbnail(link: HTMLElement, bookmark: Bookmark): void {
    const placeholder = document.createElement('div');
    placeholder.className = 'bookmark-thumb placeholder';
    placeholder.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="currentColor" d="M14,3V4H18V18H6V4H10V3H5V19H19V3H14M12,6L16,10H13V14H11V10H8L12,6Z"/></svg>';
    link.prepend(placeholder);

    void this.store.loadThumbnail(bookmark.id).then(thumb => {
      if (!thumb || !placeholder.isConnected) return;
      const img = document.createElement('img');
      img.src = thumb;
      img.alt = bookmark.title;
      img.className = 'bookmark-thumb';
      img.loading = 'lazy';
      placeholder.replaceWith(img);
    });
  }

  private async generateThumbnail(bookmark: Bookmark): Promise<void> {
    this.store.setActiveMenuBookmark(null);
    const thumb = await this.thumbnailService.generateThumbnail(bookmark.url);
    await this.store.saveThumbnail(bookmark.id, thumb);
  }

  private async handleThumbnailUpload(): Promise<void> {
    const file = this.thumbnailInput?.files?.[0];
    if (!file || !this.thumbnailTargetId) return;
    await this.store.saveThumbnail(this.thumbnailTargetId, await fileToDataUrl(file));
    this.thumbnailTargetId = null;
    if (this.thumbnailInput) this.thumbnailInput.value = '';
  }

  private closeAllMenus(): void {
    this.store.setActiveMenuBookmark(null);
  }
}
