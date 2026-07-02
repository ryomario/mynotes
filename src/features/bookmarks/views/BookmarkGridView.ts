import type { BookmarksStore } from '../state/BookmarksStore';
import type { ThumbnailService } from '../services/ThumbnailService';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import type { Bookmark, BookmarkFolder } from '../types';
import { fileToDataUrl, getBookmarkCountForFolder } from '../utils/bookmarkUtils';
import { t } from '../../../shared/services/i18n/i18n';
import { ContextMenu } from './ContextMenu';

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
    this.thumbnailInput?.addEventListener('change', () => void this.handleThumbnailUpload());

    // Right-click on empty grid area to show context menu
    this.mainEl?.addEventListener('contextmenu', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('.bookmark-card') || target.closest('.folder-card')) return;
      event.preventDefault();
      event.stopPropagation();
      this.showGridEmptyMenu(event.clientX, event.clientY);
    });
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
    const totalItems = visibleBookmarks.length + visibleFolders.length;
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

      if (i < visibleFolders.length) {
        this.renderFolderCard(card, visibleFolders[i], showUrl);
      } else {
        this.renderBookmarkCard(card, visibleBookmarks[i - visibleFolders.length], showUrl);
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

  private renderFolderCard(card: HTMLElement, folder: BookmarkFolder, showUrl: boolean): void {
    const isSelectionMode = this.store.state.isSelectionMode;

    card.classList.add('folder-card');
    card.classList.toggle('selection-disabled', isSelectionMode);
    card.setAttribute('aria-disabled', String(isSelectionMode));
    card.innerHTML = `
      <div class="bookmark-card-link" style="cursor: ${isSelectionMode ? 'not-allowed' : 'pointer'};">
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
      <button class="folder-menu-btn" title="Folder actions">⋮</button>
    `;

    // Click on folder card to navigate
    card.querySelector('.bookmark-card-link')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (this.store.state.isSelectionMode) return;
      this.store.setActiveFolder(folder.id);
      const searchEl = document.getElementById('bookmark-search') as HTMLInputElement | null;
      if (searchEl) searchEl.value = '';
      document.querySelector('.bookmarks-main')?.scrollTo({ top: 0 });
    });
    
    const triggerMenu = (clientX: number, clientY: number) => {
      const items = [
        {
          label: 'Rename',
          i18nKey: 'menu_rename',
          iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6.02 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/></svg>',
          onClick: () => {
            document.dispatchEvent(new CustomEvent('bookmarks:openRenameModal', { detail: { folderId: folder.id } }));
          }
        },
        {
          label: 'Delete',
          i18nKey: 'menu_delete',
          iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>',
          danger: true,
          onClick: async () => {
            if (confirm(t('delete_folder_confirm'))) {
              await this.store.deleteFolder(folder.id);
            }
          }
        },
        {
          label: 'Move To...',
          i18nKey: 'menu_move_to',
          iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14,18V15H10V11H14V8L19,13M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z"/></svg>',
          onClick: () => {
            document.dispatchEvent(new CustomEvent('bookmarks:openMoveToModal', { detail: { folderId: folder.id } }));
          }
        },
        {
          label: 'Open All',
          i18nKey: 'menu_open_all',
          iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/></svg>',
          onClick: async () => {
            await this.store.openAllInFolder(folder.id);
          }
        }
      ];
      ContextMenu.getInstance().show(clientX, clientY, items);
    };

    card.querySelector('.folder-menu-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      triggerMenu(rect.left, rect.bottom + 4);
    });

    card.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      triggerMenu(event.clientX, event.clientY);
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
    `;

    const link = card.querySelector('.bookmark-card-link') as HTMLAnchorElement;
    this.renderThumbnail(link, bookmark);
    if (this.store.state.isSelectionMode) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.store.toggleBookmarkSelection(bookmark.id);
      });
    }

    const triggerMenu = (clientX: number, clientY: number) => {
      const items = [
        {
          label: 'Select',
          i18nKey: 'menu_select',
          onClick: () => this.store.enterSelectionMode(bookmark.id)
        },
        {
          label: 'Edit',
          i18nKey: 'menu_edit',
          onClick: () => {
            document.dispatchEvent(new CustomEvent('bookmarks:openBookmarkModal', { detail: { mode: 'edit', bookmarkId: bookmark.id } }));
          }
        },
        {
          label: 'Generate Thumbnail',
          i18nKey: 'menu_gen_thumb',
          onClick: () => void this.generateThumbnail(bookmark)
        },
        {
          label: 'Change Thumbnail',
          i18nKey: 'menu_change_thumb',
          onClick: () => {
            this.thumbnailTargetId = bookmark.id;
            this.thumbnailInput?.click();
          }
        },
        {
          label: 'Delete',
          i18nKey: 'menu_delete',
          danger: true,
          onClick: () => {
            if (confirm(t('delete_bookmark_confirm'))) void this.store.deleteBookmark(bookmark.id);
          }
        }
      ];
      ContextMenu.getInstance().show(clientX, clientY, items);
    };

    card.querySelector('.bookmark-menu-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      triggerMenu(rect.left, rect.bottom + 4);
    });

    card.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      triggerMenu(event.clientX, event.clientY);
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

  private showGridEmptyMenu(x: number, y: number): void {
    const items = [
      {
        label: 'New Folder',
        i18nKey: 'add_folder_title',
        iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10M12,10H14V14H18V16H14V20H12V16H8V14H12V10Z"/></svg>',
        onClick: () => {
          document.dispatchEvent(new CustomEvent('bookmarks:openFolderModal', { detail: { mode: 'create' } }));
        }
      },
      {
        label: 'New Bookmark',
        i18nKey: 'add_bookmark_title',
        iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5A2,2 0 0,0 17,3M12,8L14,12H18L15,14.5L16,18.5L12,16L8,18.5L9,14.5L6,12H10L12,8Z"/></svg>',
        onClick: () => {
          document.dispatchEvent(new CustomEvent('bookmarks:openBookmarkModal', { detail: { mode: 'create' } }));
        }
      }
    ];

    ContextMenu.getInstance().show(x, y, items);
  }
}
