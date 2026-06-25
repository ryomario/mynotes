import type { BookmarksStore } from '../state/BookmarksStore';
import type { BookmarkFolder } from '../types';
import { getBookmarkCountForFolder } from '../utils/bookmarkUtils';
import { t } from '../../../shared/services/i18n/i18n';
import { ContextMenu } from './ContextMenu';

export class FolderTreeView {
  private folderListEl = document.getElementById('bookmark-folders') as HTMLElement | null;
  private searchEl = document.getElementById('bookmark-search') as HTMLInputElement | null;

  constructor(private store: BookmarksStore) { }

  init(): void {
    this.store.subscribe(() => this.render());
    
    // Right-click on empty area of sidebar folders list
    this.folderListEl?.addEventListener('contextmenu', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('.folder-item')) return;
      event.preventDefault();
      event.stopPropagation();
      this.showEmptyAreaMenu(event.clientX, event.clientY);
    });
  }

  private render(): void {
    if (!this.folderListEl) return;

    const { folders } = this.store.state;
    this.folderListEl.innerHTML = '';

    const allFolder = folders.find(folder => folder.id === 'all');
    if (allFolder) this.folderListEl.appendChild(this.createFolderNode(allFolder, 0));

    this.expandFoldersContainsActiveFolder(folders);

    folders
      .filter(folder => folder.id !== 'all' && !folder.parentId)
      .forEach(folder => this.folderListEl?.appendChild(this.createFolderBranch(folder, 0)));
  }

  private createFolderBranch(folder: BookmarkFolder, level: number): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'folder-tree-node';
    wrap.appendChild(this.createFolderNode(folder, level));

    const children = this.store.state.folders.filter(child => child.parentId === folder.id);
    if (children.length > 0) {
      const childrenWrap = document.createElement('div');
      const isExpanded = this.store.state.expandedFolderIds.has(folder.id);
      childrenWrap.className = `folder-children ${isExpanded ? '' : 'collapsed'}`;
      children.forEach(child => childrenWrap.appendChild(this.createFolderBranch(child, level + 1)));
      wrap.appendChild(childrenWrap);
    }

    return wrap;
  }

  private createFolderNode(folder: BookmarkFolder, level: number): HTMLElement {
    const { folders, bookmarks, activeFolderId, expandedFolderIds } = this.store.state;
    const hasChildren = folders.some(child => child.parentId === folder.id);
    const isExpanded = expandedFolderIds.has(folder.id);
    const count = getBookmarkCountForFolder(folders, bookmarks, folder.id);

    const row = document.createElement('div');
    row.className = `folder-item ${folder.id === activeFolderId ? 'active' : ''}`;
    row.style.paddingLeft = `${14 + (level * 16)}px`;

    const toggle = document.createElement('button');
    toggle.className = `folder-toggle ${hasChildren ? '' : 'empty'}`;
    toggle.type = 'button';
    toggle.textContent = hasChildren ? (isExpanded ? '▾' : '▸') : '';
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (hasChildren) this.store.toggleFolderCollapse(folder.id);
    });

    const left = document.createElement('div');
    left.className = 'folder-left';
    if (folder.id !== 'all') {
      left.innerHTML = '<svg class="folder-icon" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10Z"/></svg>';
    }

    const isRenaming = this.store.state.renamingFolderId === folder.id;
    if (isRenaming) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'folder-rename-input';
      input.value = folder.name;
      input.style.width = '120px';
      input.style.background = 'rgba(255, 255, 255, 0.05)';
      input.style.border = '1px solid var(--accent)';
      input.style.color = 'var(--text-primary)';
      input.style.borderRadius = '4px';
      input.style.padding = '1px 4px';
      input.style.fontSize = 'inherit';

      const save = async () => {
        const val = input.value.trim();
        if (val && val !== folder.name) {
          await this.store.renameFolder(folder.id, val);
        }
        this.store.setRenamingFolder(null);
      };

      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('mousedown', (e) => e.stopPropagation());
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          await save();
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          this.store.setRenamingFolder(null);
        }
      });
      input.addEventListener('blur', async () => {
        await save();
      });

      left.appendChild(input);
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    } else {
      const nameEl = document.createElement('span');
      nameEl.textContent = folder.name;
      left.appendChild(nameEl);
    }

    const countEl = document.createElement('span');
    countEl.className = 'folder-count';
    countEl.textContent = String(count);

    row.append(toggle, left, countEl);
    row.addEventListener('click', () => {
      this.store.setActiveFolder(folder.id);
      if (this.searchEl) this.searchEl.value = '';
      document.querySelector('.bookmarks-main')?.scrollTo({ top: 0 });
    });

    // Right-click context menu for sidebar folder (skip 'all')
    if (folder.id !== 'all') {
      row.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.showSidebarFolderMenu(event.clientX, event.clientY, folder);
      });
    }

    return row;
  }

  private expandFoldersContainsActiveFolder(folders: BookmarkFolder[]): void {
    const folderParentMap = new Map(
      folders
        .filter(folder => folder.id !== 'all')
        .map(folder => [folder.id, folder.parentId])
    );

    let parentId = folderParentMap.get(this.store.state.activeFolderId);

    while (parentId) {
      if (!this.store.state.expandedFolderIds.has(parentId)) {
        this.store.state.expandedFolderIds.add(parentId);
      }

      parentId = folderParentMap.get(parentId);
    }
  }

  private showSidebarFolderMenu(x: number, y: number, folder: BookmarkFolder): void {
    const items = [
      {
        label: 'Rename',
        i18nKey: 'menu_rename',
        iconHtml: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6.02 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/></svg>',
        onClick: () => {
          this.store.setRenamingFolder(folder.id);
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

    ContextMenu.getInstance().show(x, y, items);
  }

  private showEmptyAreaMenu(x: number, y: number): void {
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
