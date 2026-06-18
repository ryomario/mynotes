import type { BrowserService } from '../../../shared/services/browser/BrowserService';
import type { StorageService } from '../../../shared/services/storage/StorageService';

export class ThumbnailService {
  constructor(private browser: BrowserService, private storage: StorageService) {}

  /** Generate a thumbnail for a bookmark URL.
   *  Returns a data URL string.
   */
  async generateThumbnail(url: string): Promise<string> {
    if (this.browser.captureVisibleTab && this.browser.createPopup && this.browser.closeWindow && this.browser.onTabUpdated) {
      try {
        const { id: windowId, tabId } = await this.browser.createPopup(url, 640, 480);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const unsubscribe = this.browser.onTabUpdated((updatedTabId, status) => {
            if (updatedTabId === tabId && status === 'complete') {
              unsubscribe();
              setTimeout(() => {
                this.browser.captureVisibleTab(windowId)
                  .then(resolve)
                  .catch(reject);
              }, 3000);
            }
          });
          setTimeout(() => {
            unsubscribe();
            reject(new Error('Capture timeout'));
          }, 20000);
        });
        await this.browser.closeWindow(windowId);
        return dataUrl;
      } catch (e) {
        console.error('Chrome API capture failed, falling back:', e);
      }
    }
    // Fallback: use WordPress mshots or other public screenshot API
    const fallbackUrl = `https://image.thum.io/get/width/200/${encodeURIComponent(url)}`;
    const response = await fetch(fallbackUrl);
    const blob = await response.blob();
    return await this.blobToDataURL(blob);
  }

  /** Batch generate thumbnails for an array of bookmark IDs.
   *  Calls `onProgress` with the number of completed items.
   */
  async batchGenerate(ids: string[], getUrl: (id: string) => string, onProgress?: (completed: number, total: number) => void): Promise<void> {
    const total = ids.length;
    for (let i = 0; i < total; i++) {
      const id = ids[i];
      const url = getUrl(id);
      const thumb = await this.generateThumbnail(url);
      await this.storage.saveThumbnail(id, thumb);
      if (onProgress) onProgress(i + 1, total);
    }
  }

  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
