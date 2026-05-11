import { addBookmark, addBookmarkFolder, bookmarkState, getVisibleBookmarks, setActiveFolder, setSearchQuery, toggleFolderCollapse, updateBookmark, updateBookmarkSettings, updateBookmarkThumbnail } from './state';

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
const settingsBtn = document.getElementById('bookmarks-settings-btn') as HTMLButtonElement;
const settingsSidebar = document.getElementById('bookmarks-settings-sidebar') as HTMLElement;
const settingsCloseBtn = document.getElementById('bookmarks-settings-close') as HTMLButtonElement;
const defaultFolderSelect = document.getElementById('settings-default-folder') as HTMLSelectElement;
const openNewTabToggle = document.getElementById('settings-open-new-tab') as HTMLInputElement;
const showUrlToggle = document.getElementById('settings-show-url') as HTMLInputElement;
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

export function initBookmarksUI() {
  renderFolders();
  renderFolderOptions();
  syncSettingsControls();
  renderGrid();

  settingsBtn.addEventListener('click', () => settingsSidebar.classList.add('show'));
  settingsCloseBtn.addEventListener('click', () => settingsSidebar.classList.remove('show'));

  defaultFolderSelect.addEventListener('change', () => {
    updateBookmarkSettings({ defaultFolderId: defaultFolderSelect.value });
    syncSettingsControls();
  });

  openNewTabToggle.addEventListener('change', () => {
    updateBookmarkSettings({ openNewBookmarkInNewTab: openNewTabToggle.checked });
    renderGrid();
  });

  showUrlToggle.addEventListener('change', () => {
    updateBookmarkSettings({ showUrlInCard: showUrlToggle.checked });
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
    updateBookmarkThumbnail(thumbnailTargetId, dataUrl);
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
        folderId: selectedFolderId,
        thumbnail,
        keepExistingThumbnail: !thumbFile
      });
    } else {
      addBookmark({ title, url, thumbnail, folderId: selectedFolderId });
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

  const settings = bookmarkState.settings;
  const fallback = bookmarkState.folders.find(folder => folder.id !== 'all')?.id ?? 'all';
  const selectedBySetting = settings?.defaultFolderId ?? fallback;

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

function syncSettingsControls() {
  const settings = bookmarkState.settings;
  if (!settings) return;

  if (defaultFolderSelect.options.length > 0) {
    defaultFolderSelect.value = settings.defaultFolderId;
  }
  openNewTabToggle.checked = settings.openNewBookmarkInNewTab;
  showUrlToggle.checked = settings.showUrlInCard;
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
  const isCollapsed = bookmarkState.collapsedFolderIds.has(folder.id);

  if (children.length > 0) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = `folder-children ${isCollapsed ? 'collapsed' : ''}`;
    children.forEach(child => childrenWrap.appendChild(createFolderBranch(child, level + 1)));
    wrap.appendChild(childrenWrap);
  }

  return wrap;
}

function createFolderNode(folder: { id: string; name: string; parentId?: string | null }, level: number): HTMLElement {
  const count = folder.id === 'all'
    ? bookmarkState.bookmarks.length
    : bookmarkState.bookmarks.filter(b => b.folderId === folder.id).length;

  const hasChildren = bookmarkState.folders.some(f => f.parentId === folder.id);
  const isCollapsed = bookmarkState.collapsedFolderIds.has(folder.id);

  const row = document.createElement('div');
  row.className = `folder-item ${folder.id === bookmarkState.activeFolderId ? 'active' : ''}`;
  row.style.paddingLeft = `${14 + (level * 16)}px`;

  const toggle = document.createElement('button');
  toggle.className = `folder-toggle ${hasChildren ? '' : 'empty'}`;
  toggle.type = 'button';
  toggle.textContent = hasChildren ? (isCollapsed ? '▸' : '▾') : '';
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
    renderFolders();
    renderGrid();
  });

  return row;
}

function renderGrid() {
  const visible = getVisibleBookmarks();
  gridEl.innerHTML = '';

  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'bookmarks-empty';
    empty.textContent = 'No bookmarks found.';
    gridEl.appendChild(empty);
  }

  const addCard = document.createElement('article');
  addCard.className = 'bookmark-card bookmark-add-card';
  addCard.innerHTML = `
    <button class="bookmark-add-btn" type="button">
      <span class="bookmark-add-icon">&plus;</span>
      <span>Tambah Bookmark</span>
    </button>
  `;
  addCard.querySelector('.bookmark-add-btn')?.addEventListener('click', () => openBookmarkModal('create'));
  gridEl.appendChild(addCard);

  if (visible.length === 0) return;

  visible.forEach(bookmark => {
    const card = document.createElement('article');
    card.className = 'bookmark-card';

    const thumbnail = bookmark.thumbnail
      ? `<img src="${bookmark.thumbnail}" alt="${bookmark.title}" class="bookmark-thumb" />`
      : `<div class="bookmark-thumb placeholder">
          <svg viewBox="0 0 24 24" width="34" height="34">
            <path fill="currentColor" d="M14,3V4H18V18H6V4H10V3H5V19H19V3H14M12,6L16,10H13V14H11V10H8L12,6Z"/>
          </svg>
        </div>`;

    const openInNewTab = bookmarkState.settings?.openNewBookmarkInNewTab ?? true;
    const targetAttr = openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';
    const showUrl = bookmarkState.settings?.showUrlInCard ?? true;

    card.innerHTML = `
      <a class="bookmark-card-link" href="${bookmark.url}" ${targetAttr}>
        ${thumbnail}
        <div class="bookmark-meta">
          <h3 class="${showUrl ? '' : 'no-url'}">${bookmark.title}</h3>
          ${showUrl ? `<p>${bookmark.url}</p>` : ''}
        </div>
      </a>
      <button class="bookmark-menu-btn" title="Bookmark actions">⋮</button>
      <div class="bookmark-menu">
        <button class="bookmark-menu-item edit-bookmark">Edit</button>
        <button class="bookmark-menu-item upload-thumb">Ubah thumbnail</button>
      </div>
    `;

    const menuBtn = card.querySelector('.bookmark-menu-btn') as HTMLButtonElement;
    const menu = card.querySelector('.bookmark-menu') as HTMLDivElement;
    const uploadBtn = card.querySelector('.upload-thumb') as HTMLButtonElement;
    const editBtn = card.querySelector('.edit-bookmark') as HTMLButtonElement;

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

    gridEl.appendChild(card);
  });
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
    const defaultFolderId = bookmarkState.settings?.defaultFolderId
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
