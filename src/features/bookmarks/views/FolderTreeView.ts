import type { BookmarksStore } from '../state/BookmarksStore';
import type { BookmarkFolder } from '../types';
import { getBookmarkCountForFolder } from '../utils/bookmarkUtils';

export class FolderTreeView {
  private folderListEl = document.getElementById('bookmark-folders') as HTMLElement | null;
  private searchEl = document.getElementById('bookmark-search') as HTMLInputElement | null;

  constructor(private store: BookmarksStore) { }

  init(): void {
    this.store.subscribe(() => this.render());
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
    const nameEl = document.createElement('span');
    nameEl.textContent = folder.name;
    left.appendChild(nameEl);

    const countEl = document.createElement('span');
    countEl.className = 'folder-count';
    countEl.textContent = String(count);

    row.append(toggle, left, countEl);
    row.addEventListener('click', () => {
      this.store.setActiveFolder(folder.id);
      if (this.searchEl) this.searchEl.value = '';
      document.querySelector('.bookmarks-main')?.scrollTo({ top: 0 });
    });

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
}
