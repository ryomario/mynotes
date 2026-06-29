import { t } from '../../../shared/services/i18n/i18n';
import type { BookmarksStore } from '../state/BookmarksStore';

export class RenameModalView {
  private modalBackdrop = document.getElementById('rename-modal-backdrop') as HTMLElement | null;
  private closeBtn = document.getElementById('rename-modal-close') as HTMLButtonElement | null;
  private cancelBtn = document.getElementById('rename-cancel-btn') as HTMLButtonElement | null;
  private form = document.getElementById('rename-form') as HTMLFormElement | null;
  private input = document.getElementById('rename-folder-input') as HTMLInputElement | null;
  private modalTitle = document.getElementById('rename-modal-title') as HTMLElement | null;

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
    document.addEventListener('bookmarks:openRenameModal', (event) => {
      const detail = (event as CustomEvent<{ folderId: string }>).detail;
      if (detail && detail.folderId) {
        this.open(detail.folderId);
      }
    });
  }

  open(folderId: string): void {
    const folder = this.store.state.folders.find(f => f.id === folderId);
    if (!folder || !this.modalBackdrop || !this.input) return;

    this.folderId = folderId;
    if (this.modalTitle) {
      this.modalTitle.textContent = `${t('rename_title')} - ${folder.name}`;
    }

    this.input.value = folder.name || '';
    this.modalBackdrop.hidden = false;
    this.input.focus();
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

    const name = this.input?.value || '';
    await this.store.renameFolder(this.folderId, name);
    this.close();
  }
}
