import { t } from '../../../shared/services/i18n/i18n';
import type { BookmarksStore } from '../state/BookmarksStore';
import { orderFoldersForSelect, getDescendantFolderIds } from '../utils/bookmarkUtils';

export class MoveToModalView {
  private modalBackdrop = document.getElementById('move-to-modal-backdrop') as HTMLElement | null;
  private closeBtn = document.getElementById('move-to-modal-close') as HTMLButtonElement | null;
  private cancelBtn = document.getElementById('move-to-cancel-btn') as HTMLButtonElement | null;
  private form = document.getElementById('move-to-form') as HTMLFormElement | null;
  private parentInput = document.getElementById('move-to-parent-input') as HTMLSelectElement | null;
  private modalTitle = document.getElementById('move-to-modal-title') as HTMLElement | null;

  private folderId: string | null = null;

  constructor(private store: BookmarksStore) { }

  init(): void {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.cancelBtn?.addEventListener('click', () => this.close());
    let mousedownTarget: EventTarget | null = null;
    this.modalBackdrop?.addEventListener('mousedown', (event) => {
      mousedownTarget = event.target;
    });
    this.modalBackdrop?.addEventListener('click', (event) => {
      if (mousedownTarget === this.modalBackdrop && event.target === this.modalBackdrop) this.close();
    });
    this.form?.addEventListener('submit', (event) => void this.handleSubmit(event));
    document.addEventListener('bookmarks:openMoveToModal', (event) => {
      const detail = (event as CustomEvent<{ folderId: string }>).detail;
      if (detail && detail.folderId) {
        this.open(detail.folderId);
      }
    });
  }

  open(folderId: string): void {
    const folder = this.store.state.folders.find(f => f.id === folderId);
    if (!folder || !this.modalBackdrop || !this.parentInput) return;

    this.folderId = folderId;
    if (this.modalTitle) {
      this.modalTitle.textContent = `${t('move_to_title')} - ${folder.name}`;
    }

    this.parentInput.innerHTML = `<option value="">${t('no_parent_option')}</option>`;
    
    const descendants = new Set(getDescendantFolderIds(this.store.state.folders, folderId));
    
    orderFoldersForSelect(this.store.state.folders).forEach(f => {
      if (f.id === 'all') return;
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = `${'-'.repeat(f.level)}${f.level > 0 ? ' ' : ''}${f.name}`;
      
      if (f.id === folderId || descendants.has(f.id)) {
        option.disabled = true;
      }
      
      this.parentInput?.appendChild(option);
    });

    this.parentInput.value = folder.parentId || '';
    this.modalBackdrop.hidden = false;
  }

  close(): void {
    if (this.modalBackdrop) {
      this.modalBackdrop.hidden = true;
    }
    this.folderId = null;
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.folderId) return;

    const parentId = this.parentInput?.value || '';
    await this.store.moveFolder(this.folderId, parentId);
    this.close();
  }
}
