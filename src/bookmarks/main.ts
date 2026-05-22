import { initBookmarkState } from './state';
import { initBookmarksUI } from './ui';
import { translateDOM, createLanguageSelectorComponent } from '../utils/i18n';

async function init() {
  // Initialize translations
  translateDOM();

  await initBookmarkState();
  initBookmarksUI();

  // Inject language selector
  const settingsSection = document.querySelector('#bookmarks-settings-sidebar .settings-content .settings-section');
  if (settingsSection) {
    settingsSection.appendChild(createLanguageSelectorComponent());
  }
}

void init();
