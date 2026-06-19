import type { BookmarkSettings } from '../../../shared/types';

const SETTINGS_KEY = 'mynotes_bookmark_settings';

const defaultSettings: BookmarkSettings = {
  defaultFolderId: 'favorites',
  openNewBookmarkInNewTab: true,
  showUrlInCard: true,
};

/** Retrieve stored settings or defaults */
export function getBookmarkSettings(): BookmarkSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BookmarkSettings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse bookmark settings', e);
  }
  return defaultSettings;
}

/** Persist a single setting key/value */
export function saveBookmarkSetting<K extends keyof BookmarkSettings>(key: K, value: BookmarkSettings[K]): void {
  const settings = getBookmarkSettings();
  const updated = { ...settings, [key]: value };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

/** Exported service object for convenience */
export const bookmarkSettingsService = {
  getBookmarkSettings,
  saveBookmarkSetting,
};
