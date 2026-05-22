import { addBookmark, addBookmarkFolder, bookmarkState, getVisibleBookmarks, setActiveFolder, setSearchQuery, toggleFolderCollapse, updateBookmark, deleteBookmarkAction, deleteBookmarksAction, loadThumbnailAction, saveThumbnailAction } from './state';
import { generateThumbnailForBookmark } from './thumbnail';
import { getBookmarkSettings, initBookmarkSettings, loadBookmarkSettings } from './settings';
import { t } from '../utils/i18n';

const folderListEl = document.getElementById('bookmark-folders') as HTMLElement;
const gridEl = document.getElementById('bookmarks-grid') as HTMLElement;
const searchEl = document.getElementById('bookmark-search') as HTMLInputElement;
const thumbnailInput = document.getElementById('thumbnail-input') as HTMLInputElement;
const modalBackdrop = document.getElementById('bookmark-modal-backdrop') as HTMLElement;
const modalCloseBtn = document.getElementById('bookmark-modal-close') as HTMLButtonElement;
const modalCancelBtn = document.getElementById('bookmark-cancel-btn') as HTMLButtonElement;
const bookmarkForm = document.getElementById('bookmark-form') as HTMLFormElement;
const bookmarkTitleInput = document.getElementById('bookmark-title-input') as HTMLInputElement;
const bookmarkUrlInput = document.getElementById('bookmark-url-input') as HTMLInputElement;
const bookmarkThumbInput = document.getElementById('bookmark-thumb-input') as HTMLInputElement;
const bookmarkFolderInput = document.getElementById('bookmark-folder-input') as HTMLSelectElement;
const defaultFolderSelect = document.getElementById('settings-default-folder') as HTMLSelectElement;
const addFolderBtn = document.getElementById('add-folder-btn') as HTMLButtonElement;
const folderModalBackdrop = document.getElementById('folder-modal-backdrop') as HTMLElement;
const folderModalCloseBtn = document.getElementById('folder-modal-close') as HTMLButtonElement;
const folderCancelBtn = document.getElementById('folder-cancel-btn') as HTMLButtonElement;
const folderForm = document.getElementById('folder-form') as HTMLFormElement;
const folderTitleInput = document.getElementById('folder-title-input') as HTMLInputElement;
const folderParentInput = document.getElementById('folder-parent-input') as HTMLSelectElement;

let thumbnailTargetId: string | null = null;
let modalMode: 'create' | 'edit' = 'create';
let editingBookmarkId: string | null = null;
let isSelectionMode = false;
const selectedBookmarkIds = new Set<string>();

export function initBookmarksUI() {
  renderFolders();
  renderFolderOptions();
  loadBookmarkSettings();
  initBookmarkSettings(() => {
    renderGrid();
  });
  renderGrid();

  const mainEl = document.querySelector('.bookmarks-main');
  if (mainEl) {
    mainEl.addEventListener('scroll', () => {
      renderGrid();
    });
  }

  window.addEventListener('resize', () => {
    renderGrid();
  });

  addFolderBtn.addEventListener('click', openFolderModal);
  folderModalCloseBtn.addEventListener('click', closeFolderModal);
  folderCancelBtn.addEventListener('click', closeFolderModal);
  folderModalBackdrop.addEventListener('click', (e) => {
    if (e.target === folderModalBackdrop) closeFolderModal();
  });

  folderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = folderTitleInput.value.trim();
    if (!name) return;

    const parentId = folderParentInput.value || null;
    const folder = addBookmarkFolder({ name, parentId });

    closeFolderModal();
    renderFolders();
    renderFolderOptions();
    setActiveFolder(folder.id);
    renderFolders();
    renderGrid();
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.bookmark-menu') && !target.closest('.bookmark-menu-btn')) {
      closeAllMenus();
    }
  });

  searchEl.addEventListener('input', () => {
    setSearchQuery(searchEl.value);
    renderGrid();
  });

  thumbnailInput.addEventListener('change', async () => {
    const file = thumbnailInput.files?.[0];
    if (!file || !thumbnailTargetId) return;

    const dataUrl = await fileToDataUrl(file);
    await saveThumbnailAction(thumbnailTargetId, dataUrl);
    thumbnailTargetId = null;
    thumbnailInput.value = '';
    renderGrid();
  });

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeBookmarkModal();
    }
  });

  modalCloseBtn.addEventListener('click', closeBookmarkModal);
  modalCancelBtn.addEventListener('click', closeBookmarkModal);

  bookmarkForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = bookmarkTitleInput.value.trim();
    const url = bookmarkUrlInput.value.trim();
    if (!title || !url) return;

    if (!isValidUrl(url)) {
      bookmarkUrlInput.setCustomValidity('URL tidak valid. Gunakan format https://domain.com');
      bookmarkUrlInput.reportValidity();
      return;
    }
    bookmarkUrlInput.setCustomValidity('');

    const thumbFile = bookmarkThumbInput.files?.[0];
    const thumbnail = thumbFile ? await fileToDataUrl(thumbFile) : undefined;
    const selectedFolderId = bookmarkFolderInput.value || undefined;

    if (modalMode === 'edit' && editingBookmarkId) {
      updateBookmark({
        id: editingBookmarkId,
        title,
        url,
        folderId: selectedFolderId
      });
      if (thumbnail) {
        await saveThumbnailAction(editingBookmarkId, thumbnail);
      }
    } else {
      addBookmark({ title, url, folderId: selectedFolderId });
      // Note: We can't easily get the ID of the newly added bookmark here 
      // without changing addBookmark return type. 
      // Actually, addBookmark returns void. 
    }

    closeBookmarkModal();
    renderFolders();
    renderFolderOptions();
    renderGrid();
  });
}

function renderFolderOptions() {
  bookmarkFolderInput.innerHTML = '';
  defaultFolderSelect.innerHTML = '';
  folderParentInput.innerHTML = '<option value="">No parent (root)</option>';

  const settings = getBookmarkSettings();
  const fallback = bookmarkState.folders.find(folder => folder.id !== 'all')?.id ?? 'all';
  const selectedBySetting = settings.defaultFolderId ?? fallback;

  const roots = bookmarkState.folders.filter(folder => folder.id !== 'all' && !folder.parentId);
  const ordered: Array<{ id: string; name: string; level: number }> = [];

  const visit = (folderId: string, level: number) => {
    const folder = bookmarkState.folders.find(f => f.id === folderId);
    if (!folder || folder.id === 'all') return;
    ordered.push({ id: folder.id, name: folder.name, level });
    const children = bookmarkState.folders.filter(f => f.parentId === folder.id);
    children.forEach(child => visit(child.id, level + 1));
  };

  roots.forEach(root => visit(root.id, 0));

  ordered.forEach(folder => {
    const label = `${'-'.repeat(folder.level)}${folder.level > 0 ? ' ' : ''}${folder.name}`;

    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = label;
    bookmarkFolderInput.appendChild(option);

    const settingOption = document.createElement('option');
    settingOption.value = folder.id;
    settingOption.textContent = label;
    defaultFolderSelect.appendChild(settingOption);

    const parentOption = document.createElement('option');
    parentOption.value = folder.id;
    parentOption.textContent = label;
    folderParentInput.appendChild(parentOption);
  });

  if (bookmarkFolderInput.options.length > 0) {
    bookmarkFolderInput.value = selectedBySetting;
  }

  if (defaultFolderSelect.options.length > 0) {
    defaultFolderSelect.value = selectedBySetting;
  }
}

function renderFolders() {
  folderListEl.innerHTML = '';

  const allFolder = bookmarkState.folders.find(f => f.id === 'all');
  if (allFolder) {
    folderListEl.appendChild(createFolderNode(allFolder, 0));
  }

  const roots = bookmarkState.folders.filter(f => f.id !== 'all' && !f.parentId);
  roots.forEach(root => {
    folderListEl.appendChild(createFolderBranch(root, 0));
  });
}

function createFolderBranch(folder: { id: string; name: string; parentId?: string | null }, level: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'folder-tree-node';

  wrap.appendChild(createFolderNode(folder, level));

  const children = bookmarkState.folders.filter(f => f.parentId === folder.id);
  const isExpanded = bookmarkState.expandedFolderIds.has(folder.id);

  if (children.length > 0) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = `folder-children ${isExpanded ? '' : 'collapsed'}`;
    children.forEach(child => childrenWrap.appendChild(createFolderBranch(child, level + 1)));
    wrap.appendChild(childrenWrap);
  }

  return wrap;
}

function getAllDescendantFolderIds(folderId: string): string[] {
  const ids: string[] = [];
  const findChildren = (parent: string) => {
    const children = bookmarkState.folders.filter(f => f.parentId === parent);
    for (const child of children) {
      ids.push(child.id);
      findChildren(child.id);
    }
  };
  findChildren(folderId);
  return ids;
}

function createFolderNode(folder: { id: string; name: string; parentId?: string | null }, level: number): HTMLElement {
  let count = 0;
  if (folder.id === 'all') {
    count = bookmarkState.bookmarks.length;
  } else {
    const folderIds = [folder.id, ...getAllDescendantFolderIds(folder.id)];
    count = bookmarkState.bookmarks.filter(b => b.folderId && folderIds.includes(b.folderId)).length;
  }

  const hasChildren = bookmarkState.folders.some(f => f.parentId === folder.id);
  const isExpanded = bookmarkState.expandedFolderIds.has(folder.id);

  const row = document.createElement('div');
  row.className = `folder-item ${folder.id === bookmarkState.activeFolderId ? 'active' : ''}`;
  row.style.paddingLeft = `${14 + (level * 16)}px`;

  const toggle = document.createElement('button');
  toggle.className = `folder-toggle ${hasChildren ? '' : 'empty'}`;
  toggle.type = 'button';
  toggle.textContent = hasChildren ? (isExpanded ? '▾' : '▸') : '';
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!hasChildren) return;
    toggleFolderCollapse(folder.id);
    renderFolders();
  });

  const left = document.createElement('div');
  left.className = 'folder-left';
  if (folder.id !== 'all') {
    left.innerHTML = `<svg class="folder-icon" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10Z"/></svg>`;
  }
  const nameEl = document.createElement('span');
  nameEl.textContent = folder.name;
  left.appendChild(nameEl);

  const countEl = document.createElement('span');
  countEl.className = 'folder-count';
  countEl.textContent = String(count);

  row.appendChild(toggle);
  row.appendChild(left);
  row.appendChild(countEl);

  row.addEventListener('click', () => {
    setActiveFolder(folder.id);
    setSearchQuery('');
    const searchInput = document.getElementById('bookmark-search') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    const mainEl = document.querySelector('.bookmarks-main');
    if (mainEl) mainEl.scrollTo({ top: 0 });

    renderFolders();
    renderGrid();
  });

  return row;
}

function renderGrid() {
  const visible = getVisibleBookmarks();
  const mainEl = document.querySelector('.bookmarks-main') as HTMLElement;
  if (!mainEl) return;

  const containerWidth = gridEl.clientWidth;
  const itemMinWidth = 230;
  const gap = 16;
  const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
  const itemWidth = (containerWidth - (columns - 1) * gap) / columns;
  const settings = getBookmarkSettings();
  const showUrl = settings.showUrlInCard ?? true;
  const itemHeight = showUrl ? 200 : 174;

  // Header & Selection UI
  const toolbarEl = document.querySelector('.bookmarks-toolbar');
  if (toolbarEl) {
    let selectionUI = toolbarEl.querySelector('.selection-ui');
    if (isSelectionMode) {
      if (!selectionUI) {
        selectionUI = document.createElement('div');
        selectionUI.className = 'selection-ui';
        toolbarEl.appendChild(selectionUI);
      }
      const allSelected = visible.length > 0 && selectedBookmarkIds.size === visible.length;
      selectionUI.innerHTML = `
        <span class="selection-count">${t('selected_count', { count: String(selectedBookmarkIds.size) })}</span>
        <button class="btn-action select-all-btn">${allSelected ? t('deselect_all') : t('select_all')}</button>
        <button class="btn-action primary delete-selected-btn" style="background: #ef4444; color: white;">${t('delete_selected')}</button>
        <button class="btn-action cancel-selection-btn">${t('cancel_btn')}</button>
      `;
      selectionUI.querySelector('.select-all-btn')?.addEventListener('click', () => {
        if (allSelected) {
          selectedBookmarkIds.clear();
          isSelectionMode = false;
        } else {
          visible.forEach(b => selectedBookmarkIds.add(b.id));
        }
        renderGrid();
      });
      selectionUI.querySelector('.cancel-selection-btn')?.addEventListener('click', () => {
        isSelectionMode = false;
        selectedBookmarkIds.clear();
        renderGrid();
      });
      selectionUI.querySelector('.delete-selected-btn')?.addEventListener('click', () => {
        if (selectedBookmarkIds.size === 0) return;
        if (confirm(t('delete_multiple_confirm', { count: String(selectedBookmarkIds.size) }))) {
          deleteBookmarksAction(Array.from(selectedBookmarkIds));
          isSelectionMode = false;
          selectedBookmarkIds.clear();
          renderFolders();
          renderGrid();
        }
      });
    } else {
      if (selectionUI) selectionUI.remove();
    }
  }

  // Virtualization
  const scrollTop = mainEl.scrollTop;
  const viewportHeight = mainEl.clientHeight;

  // Adjusted to include "Add Bookmark" card at the start
  const totalItems = visible.length + 1;
  const totalRows = Math.ceil(totalItems / columns);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  gridEl.style.height = `${totalHeight}px`;
  gridEl.innerHTML = '';

  const startRow = Math.max(0, Math.floor((scrollTop - 100) / (itemHeight + gap)));
  const endRow = Math.ceil((scrollTop + viewportHeight + 100) / (itemHeight + gap));

  const startIndex = startRow * columns;
  const endIndex = Math.min(totalItems, endRow * columns);

  for (let i = startIndex; i < endIndex; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = col * (itemWidth + gap);
    const y = row * (itemHeight + gap);

    const card = document.createElement('article');
    card.className = 'bookmark-card';
    card.style.position = 'absolute';
    card.style.width = `${itemWidth}px`;
    card.style.height = `${itemHeight}px`;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;

    if (i === 0) {
      // Add Bookmark Card (localized)
      card.className += ' bookmark-add-card';
      card.innerHTML = `
        <button class="bookmark-add-btn" type="button">
          <span class="bookmark-add-icon">&plus;</span>
          <span>${t('add_bookmark_title')}</span>
        </button>
      `;
      card.querySelector('.bookmark-add-btn')?.addEventListener('click', () => openBookmarkModal('create'));
      gridEl.appendChild(card);
      continue;
    }

    const bookmark = visible[i - 1];
    const openInNewTab = settings.openNewBookmarkInNewTab ?? true;
    const targetAttr = openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';

    card.innerHTML = `
      <a class="bookmark-card-link" href="${bookmark.url}" ${targetAttr}>
        <div class="bookmark-meta">
          <h3 class="${showUrl ? '' : 'no-url'}">${bookmark.title}</h3>
          ${showUrl ? `<p>${bookmark.url}</p>` : ''}
        </div>
      </a>
      <button class="bookmark-menu-btn" title="Bookmark actions">⋮</button>
      <div class="bookmark-menu">
          <button class="bookmark-menu-item select-bookmark">${t('menu_select')}</button>
          <button class="bookmark-menu-item edit-bookmark">${t('menu_edit')}</button>
          <button class="bookmark-menu-item gen-thumb">${t('menu_gen_thumb')}</button>
          <button class="bookmark-menu-item upload-thumb">${t('menu_change_thumb')}</button>
          <button class="bookmark-menu-item delete-bookmark" style="color: #ef4444;">${t('menu_delete')}</button>
      </div>
    `;

    // Async thumbnail loading
    const thumbWrapper = card.querySelector('.bookmark-card-link') as HTMLElement;
    const placeholder = document.createElement('div');
    placeholder.className = 'bookmark-thumb placeholder';
    placeholder.innerHTML = `
      <svg viewBox="0 0 24 24" width="34" height="34">
        <path fill="currentColor" d="M14,3V4H18V18H6V4H10V3H5V19H19V3H14M12,6L16,10H13V14H11V10H8L12,6Z"/>
      </svg>
    `;
    thumbWrapper.prepend(placeholder);

    loadThumbnailAction(bookmark.id).then(thumb => {
      if (thumb) {
        placeholder.remove();
        const img = document.createElement('img');
        img.src = thumb;
        img.alt = bookmark.title;
        img.className = 'bookmark-thumb';
        img.loading = 'lazy';
        thumbWrapper.prepend(img);
      }
    });

    const link = card.querySelector('.bookmark-card-link') as HTMLAnchorElement;
    if (isSelectionMode) {
      card.classList.toggle('selected', selectedBookmarkIds.has(bookmark.id));
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedBookmarkIds.has(bookmark.id)) {
          selectedBookmarkIds.delete(bookmark.id);
        } else {
          selectedBookmarkIds.add(bookmark.id);
        }
        if (selectedBookmarkIds.size === 0) isSelectionMode = false;
        renderGrid();
      });
    }

    const menuBtn = card.querySelector('.bookmark-menu-btn') as HTMLButtonElement;
    const menu = card.querySelector('.bookmark-menu') as HTMLDivElement;
    const uploadBtn = card.querySelector('.upload-thumb') as HTMLButtonElement;
    const genThumbBtn = card.querySelector('.gen-thumb') as HTMLButtonElement;
    const editBtn = card.querySelector('.edit-bookmark') as HTMLButtonElement;
    const selectBtn = card.querySelector('.select-bookmark') as HTMLButtonElement;
    const deleteBtn = card.querySelector('.delete-bookmark') as HTMLButtonElement;

    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllMenus();
      const willShow = !menu.classList.contains('show');
      menu.classList.toggle('show', willShow);
      card.classList.toggle('menu-open', willShow);
    });

    editBtn.addEventListener('click', () => {
      menu.classList.remove('show');
      card.classList.remove('menu-open');
      openBookmarkModal('edit', bookmark.id);
    });

    uploadBtn.addEventListener('click', () => {
      thumbnailTargetId = bookmark.id;
      menu.classList.remove('show');
      card.classList.remove('menu-open');
      thumbnailInput.click();
    });

    genThumbBtn.addEventListener('click', async () => {
      menu.classList.remove('show');
      card.classList.remove('menu-open');

      // Instantly show shimmering skeleton loading animation
      const thumbWrapper = card.querySelector('.bookmark-card-link') as HTMLElement;
      if (thumbWrapper) {
        const existingThumb = thumbWrapper.querySelector('.bookmark-thumb');
        if (existingThumb) {
          const loadingPlaceholder = document.createElement('div');
          loadingPlaceholder.className = 'bookmark-thumb placeholder generating';
          loadingPlaceholder.innerHTML = `
            <svg class="animate-spin" viewBox="0 0 24 24" width="34" height="34">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round" style="opacity: 0.25;"></circle>
            </svg>
          `;
          existingThumb.replaceWith(loadingPlaceholder);
        }
      }

      await generateThumbnailForBookmark(bookmark);
      renderGrid();
    });

    selectBtn.addEventListener('click', () => {
      menu.classList.remove('show');
      card.classList.remove('menu-open');
      isSelectionMode = true;
      selectedBookmarkIds.add(bookmark.id);
      renderGrid();
    });

    deleteBtn.addEventListener('click', () => {
      menu.classList.remove('show');
      card.classList.remove('menu-open');
      if (confirm(t('delete_bookmark_confirm'))) {
        deleteBookmarkAction(bookmark.id);
        renderFolders();
        renderGrid();
      }
    });

    gridEl.appendChild(card);
  }

  if (visible.length === 0 && startIndex === 0) {
    const empty = document.createElement('div');
    empty.className = 'bookmarks-empty';
    empty.textContent = t('no_bookmarks_found');
    gridEl.appendChild(empty);
  }
}

function closeAllMenus() {
  document.querySelectorAll('.bookmark-card.menu-open').forEach((card) => {
    card.classList.remove('menu-open');
  });
  document.querySelectorAll('.bookmark-menu.show').forEach((menu) => {
    menu.classList.remove('show');
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function openBookmarkModal(mode: 'create' | 'edit' = 'create', bookmarkId?: string) {
  modalMode = mode;
  editingBookmarkId = bookmarkId ?? null;

  if (mode === 'edit' && bookmarkId) {
    const bookmark = bookmarkState.bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      bookmarkTitleInput.value = bookmark.title;
      bookmarkUrlInput.value = bookmark.url;
      bookmarkFolderInput.value = bookmark.folderId;
      const modalTitle = document.getElementById('bookmark-modal-title');
      if (modalTitle) modalTitle.textContent = 'Edit Bookmark';
    }
  } else {
    const modalTitle = document.getElementById('bookmark-modal-title');
    if (modalTitle) modalTitle.textContent = 'Tambah Bookmark';
    const settings = getBookmarkSettings();
    const defaultFolderId = settings.defaultFolderId
      ?? bookmarkState.folders.find(f => f.id !== 'all')?.id
      ?? '';
    if (defaultFolderId) {
      bookmarkFolderInput.value = defaultFolderId;
    }
  }

  modalBackdrop.hidden = false;
  bookmarkTitleInput.focus();
}

function closeBookmarkModal() {
  modalBackdrop.hidden = true;
  bookmarkForm.reset();
  bookmarkUrlInput.setCustomValidity('');
  modalMode = 'create';
  editingBookmarkId = null;
  const modalTitle = document.getElementById('bookmark-modal-title');
  if (modalTitle) modalTitle.textContent = 'Tambah Bookmark';
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function openFolderModal() {
  folderForm.reset();
  folderModalBackdrop.hidden = false;
  folderTitleInput.focus();
}

function closeFolderModal() {
  folderModalBackdrop.hidden = true;
  folderForm.reset();
}
