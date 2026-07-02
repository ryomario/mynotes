import { t } from '../../../shared/services/i18n/i18n';
import type { BookmarksStore } from '../state/BookmarksStore';
import { orderFoldersForSelect } from '../utils/bookmarkUtils';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';

export class FolderModalView {
  private addFolderBtn = document.getElementById('add-folder-btn') as HTMLButtonElement | null;
  private modalBackdrop = document.getElementById('folder-modal-backdrop') as HTMLElement | null;
  private closeBtn = document.getElementById('folder-modal-close') as HTMLButtonElement | null;
  private cancelBtn = document.getElementById('folder-cancel-btn') as HTMLButtonElement | null;
  private form = document.getElementById('folder-form') as HTMLFormElement | null;
  private titleInput = document.getElementById('folder-title-input') as HTMLInputElement | null;
  private parentInput = document.getElementById('folder-parent-input') as HTMLSelectElement | null;

  constructor(private store: BookmarksStore) { }

  init(): void {
    this.addFolderBtn?.addEventListener('click', () => this.open());
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
    document.addEventListener('bookmarks:openFolderModal', () => this.open());
  }

  private renderParentOptions(): void {
    if (!this.parentInput) return;
    this.parentInput.innerHTML = `<option value="">${t('no_parent_option')}</option>`;
    orderFoldersForSelect(this.store.state.folders).forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = `${'-'.repeat(folder.level)}${folder.level > 0 ? ' ' : ''}${folder.name}`;
      this.parentInput?.appendChild(option);
    });

    const settings = bookmarkSettingsService.getBookmarkSettings();
    let defaultFolderId = settings.defaultFolderId;
    if (defaultFolderId === '__active__') {
      defaultFolderId = this.store.state.activeFolderId;
    }
    if (!defaultFolderId || defaultFolderId === 'all') {
      defaultFolderId = '';
    }
    this.parentInput.value = defaultFolderId;
  }

  private open(): void {
    if (!this.modalBackdrop || !this.form || !this.titleInput) return;
    this.form.reset();
    this.renderParentOptions();
    this.modalBackdrop.hidden = false;
    this.titleInput.focus();
  }

  private close(): void {
    if (!this.modalBackdrop || !this.form) return;
    this.modalBackdrop.hidden = true;
    this.form.reset();
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = this.titleInput?.value.trim();
    if (!name) return;
    const folder = await this.store.addFolder(name, this.parentInput?.value || null);
    this.close();
    this.store.setActiveFolder(folder.id);
  }
}
