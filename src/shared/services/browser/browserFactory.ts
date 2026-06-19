import { ChromeBrowserService } from '../../../shared/services/browser/ChromeBrowserService';
import type { BrowserService } from '../../../shared/services/browser/BrowserService';

let browserInstance: BrowserService | null = null;

/**
 * Returns a singleton BrowserService implementation.
 * In the extension environment it returns ChromeBrowserService.
 * This can be extended to provide mocks for tests.
 */
export function getBrowserService(): BrowserService {
  if (browserInstance) return browserInstance;
  // For now we always use Chrome implementation.
  browserInstance = new ChromeBrowserService();
  return browserInstance;
}
