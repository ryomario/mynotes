import { ChromeBrowserService } from '../../../shared/services/browser/ChromeBrowserService';
import type { BrowserService } from '../../../shared/services/browser/BrowserService';
import { ClientBrowserService } from './ClientBrowserService';

let browserInstance: BrowserService | null = null;

/**
 * Returns a singleton BrowserService implementation.
 * In the extension environment it returns ChromeBrowserService.
 * This can be extended to provide mocks for tests.
 */
export function getBrowserService(): BrowserService {
  if (browserInstance) return browserInstance;

  const isChromeAPI = import.meta.env.VITE_STORAGE_TYPE == 'chrome-api';
  console.log(`Using browser service: ${isChromeAPI ? 'chrome-api' : 'client'}`);

  if (isChromeAPI) {
    // Use Chrome implementation.
    browserInstance = new ChromeBrowserService();
  } else {
    browserInstance = new ClientBrowserService();
  }

  return browserInstance;
}
