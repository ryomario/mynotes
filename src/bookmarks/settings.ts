import type { BookmarkSettings } from './types';
import { generateDummyBookmarks, bookmarkState } from './state';
import { batchGenerateThumbnails } from './thumbnail';
import { t } from '../utils/i18n';

// Settings Elements
const settingsBtn = document.getElementById('bookmarks-settings-btn') as HTMLButtonElement;
const settingsSidebar = document.getElementById('bookmarks-settings-sidebar') as HTMLElement;
const settingsCloseBtn = document.getElementById('bookmarks-settings-close') as HTMLButtonElement;
const defaultFolderSelect = document.getElementById('settings-default-folder') as HTMLSelectElement;
const openNewTabToggle = document.getElementById('settings-open-new-tab') as HTMLInputElement;
const showUrlToggle = document.getElementById('settings-show-url') as HTMLInputElement;
const seedBtn = document.getElementById('settings-seed-btn') as HTMLButtonElement;
const genThumbnailsBtn = document.getElementById('settings-gen-thumbnails-btn') as HTMLButtonElement;
const seedBtnSection = document.getElementById('settings-seed-btn');

if (seedBtnSection && !import.meta.env.DEV) {
  seedBtnSection.style.display = 'none';
}

const STORAGE_KEY = 'mynotes_bookmark_settings';

export function getBookmarkSettings(): BookmarkSettings {
  const defaults: BookmarkSettings = {
    defaultFolderId: 'favorites',
    openNewBookmarkInNewTab: true,
    showUrlInCard: true
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaults;
    return { ...defaults, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to load bookmark settings', e);
    return defaults;
  }
}

export function saveBookmarkSetting<K extends keyof BookmarkSettings>(key: K, value: BookmarkSettings[K]) {
  const settings = getBookmarkSettings();
  settings[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function loadBookmarkSettings() {
  const settings = getBookmarkSettings();

  if (defaultFolderSelect) {
    defaultFolderSelect.value = settings.defaultFolderId;
  }
  if (openNewTabToggle) {
    openNewTabToggle.checked = settings.openNewBookmarkInNewTab;
  }
  if (showUrlToggle) {
    showUrlToggle.checked = settings.showUrlInCard;
  }
}

export function initBookmarkSettings(onSettingsChange?: () => void) {
  if (settingsBtn && settingsSidebar) {
    settingsBtn.addEventListener('click', () => settingsSidebar.classList.add('show'));
  }
  if (settingsCloseBtn && settingsSidebar) {
    settingsCloseBtn.addEventListener('click', () => settingsSidebar.classList.remove('show'));
  }

  if (defaultFolderSelect) {
    defaultFolderSelect.addEventListener('change', () => {
      saveBookmarkSetting('defaultFolderId', defaultFolderSelect.value);
      if (onSettingsChange) onSettingsChange();
    });
  }

  if (openNewTabToggle) {
    openNewTabToggle.addEventListener('change', () => {
      saveBookmarkSetting('openNewBookmarkInNewTab', openNewTabToggle.checked);
      if (onSettingsChange) onSettingsChange();
    });
  }

  if (showUrlToggle) {
    showUrlToggle.addEventListener('change', () => {
      saveBookmarkSetting('showUrlInCard', showUrlToggle.checked);
      if (onSettingsChange) onSettingsChange();
    });
  }

  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      if (confirm(t('seed_dummy_confirm'))) {
        seedBtn.disabled = true;
        const originalText = seedBtn.innerText;
        seedBtn.innerText = t('generating_label');

        await generateDummyBookmarks(50);

        seedBtn.innerText = originalText;
        seedBtn.disabled = false;

        if (onSettingsChange) onSettingsChange();
        alert(t('seed_dummy_success'));
      }
    });
  }

  if (genThumbnailsBtn) {
    genThumbnailsBtn.addEventListener('click', async () => {
      const bookmarks = bookmarkState.bookmarks;
      if (bookmarks.length === 0) {
        alert(t('no_bookmarks_for_thumbs'));
        return;
      }

      if (confirm(t('gen_thumbs_confirm', { count: String(bookmarks.length) }))) {
        genThumbnailsBtn.disabled = true;
        const originalText = genThumbnailsBtn.innerText;
        genThumbnailsBtn.innerText = t('generating_label');

        await batchGenerateThumbnails(bookmarks, (count) => {
          genThumbnailsBtn.innerText = t('generating_progress', { count: String(count), total: String(bookmarks.length) });
        });

        genThumbnailsBtn.innerText = originalText;
        genThumbnailsBtn.disabled = false;

        if (onSettingsChange) onSettingsChange();
        alert(t('gen_thumbs_success'));
      }
    });
  }
}
