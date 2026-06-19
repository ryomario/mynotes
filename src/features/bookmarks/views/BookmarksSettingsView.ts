import type { BookmarksStore } from '../state/BookmarksStore';
import { bookmarkSettingsService } from '../services/bookmarkSettingsService';
import type { ThumbnailService } from '../services/ThumbnailService';
import { orderFoldersForSelect } from '../utils/bookmarkUtils';
import { t } from '../../../shared/services/i18n/i18n';

export class BookmarksSettingsView {
  private settingsBtn = document.getElementById('bookmarks-settings-btn') as HTMLButtonElement | null;
  private sidebar = document.getElementById('bookmarks-settings-sidebar') as HTMLElement | null;
  private closeBtn = document.getElementById('bookmarks-settings-close') as HTMLButtonElement | null;
  private defaultFolderSelect = document.getElementById('settings-default-folder') as HTMLSelectElement | null;
  private openNewTabToggle = document.getElementById('settings-open-new-tab') as HTMLInputElement | null;
  private showUrlToggle = document.getElementById('settings-show-url') as HTMLInputElement | null;
  private seedBtn = document.getElementById('settings-seed-btn') as HTMLButtonElement | null;
  private genThumbnailsBtn = document.getElementById('settings-gen-thumbnails-btn') as HTMLButtonElement | null;

  constructor(
    private store: BookmarksStore,
    private settingsService = bookmarkSettingsService,
    private thumbnailService?: ThumbnailService,
  ) { }

  init(): void {
    if (this.seedBtn && !import.meta.env.DEV) this.seedBtn.style.display = 'none';
    this.store.subscribe(() => this.loadSettingsIntoControls());
    this.settingsBtn?.addEventListener('click', () => this.sidebar?.classList.add('show'));
    this.closeBtn?.addEventListener('click', () => this.sidebar?.classList.remove('show'));
    this.defaultFolderSelect?.addEventListener('change', () => {
      this.settingsService.saveBookmarkSetting('defaultFolderId', this.defaultFolderSelect?.value ?? 'favorites');
      this.notifySettingsChanged();
    });
    this.openNewTabToggle?.addEventListener('change', () => {
      this.settingsService.saveBookmarkSetting('openNewBookmarkInNewTab', this.openNewTabToggle?.checked ?? true);
      this.notifySettingsChanged();
    });
    this.showUrlToggle?.addEventListener('change', () => {
      this.settingsService.saveBookmarkSetting('showUrlInCard', this.showUrlToggle?.checked ?? true);
      this.notifySettingsChanged();
    });
    this.seedBtn?.addEventListener('click', () => void this.generateDummyBookmarks());
    this.genThumbnailsBtn?.addEventListener('click', () => void this.generateAllThumbnails());
    this.loadSettingsIntoControls();
  }

  private loadSettingsIntoControls(): void {
    const settings = this.settingsService.getBookmarkSettings();
    if (this.defaultFolderSelect) {
      const selected = this.defaultFolderSelect.value || settings.defaultFolderId;
      this.defaultFolderSelect.innerHTML = '';
      orderFoldersForSelect(this.store.state.folders).forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = `${'-'.repeat(folder.level)}${folder.level > 0 ? ' ' : ''}${folder.name}`;
        this.defaultFolderSelect?.appendChild(option);
      });
      this.defaultFolderSelect.value = selected;
    }
    if (this.openNewTabToggle) this.openNewTabToggle.checked = settings.openNewBookmarkInNewTab;
    if (this.showUrlToggle) this.showUrlToggle.checked = settings.showUrlInCard;
  }

  private async generateDummyBookmarks(): Promise<void> {
    if (!this.seedBtn || !confirm(t('seed_dummy_confirm'))) return;
    const originalText = this.seedBtn.innerText;
    this.seedBtn.disabled = true;
    this.seedBtn.innerText = t('generating_label');
    await this.store.generateDummyBookmarks(50);
    this.seedBtn.innerText = originalText;
    this.seedBtn.disabled = false;
    alert(t('seed_dummy_success'));
  }

  private async generateAllThumbnails(): Promise<void> {
    if (!this.genThumbnailsBtn || !this.thumbnailService) return;
    const bookmarks = this.store.state.bookmarks;
    if (bookmarks.length === 0) {
      alert(t('no_bookmarks_for_thumbs'));
      return;
    }
    if (!confirm(t('gen_thumbs_confirm', { count: String(bookmarks.length) }))) return;

    const originalText = this.genThumbnailsBtn.innerText;
    this.genThumbnailsBtn.disabled = true;
    this.genThumbnailsBtn.innerText = t('generating_label');
    for (let index = 0; index < bookmarks.length; index += 1) {
      const bookmark = bookmarks[index];
      const thumbnail = await this.thumbnailService.generateThumbnail(bookmark.url);
      await this.store.saveThumbnail(bookmark.id, thumbnail);
      this.genThumbnailsBtn.innerText = t('generating_progress', {
        count: String(index + 1),
        total: String(bookmarks.length),
      });
    }
    this.genThumbnailsBtn.innerText = originalText;
    this.genThumbnailsBtn.disabled = false;
    alert(t('gen_thumbs_success'));
  }

  private notifySettingsChanged(): void {
    document.dispatchEvent(new CustomEvent('bookmarks:settingsChanged'));
  }
}
