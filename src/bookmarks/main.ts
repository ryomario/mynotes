import { initBookmarkState } from './state';
import { initBookmarksUI } from './ui';

async function init() {
  await initBookmarkState();
  initBookmarksUI();
}

void init();
