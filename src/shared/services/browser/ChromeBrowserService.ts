import type { BrowserService } from './BrowserService';

export class ChromeBrowserService implements BrowserService {
  public getFaviconUrl(pageUrl: string, size: number): string {
    const extensionId = chrome.runtime.id;
    return `chrome-extension://${extensionId}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`;
  }

  public async createPopup(url: string, width: number, height: number): Promise<{ id: number; tabId: number }> {
    return new Promise((resolve, reject) => {
      chrome.windows.create({
        url,
        focused: true,
        type: 'popup',
        width,
        height,
      }, (window) => {
        if (chrome.runtime.lastError || !window || !window.id || !window.tabs || window.tabs.length === 0) {
          reject(chrome.runtime.lastError || new Error('Failed to create capture window'));
        } else {
          resolve({ id: window.id, tabId: window.tabs[0].id! });
        }
      });
    });
  }

  public async captureVisibleTab(windowId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 40 }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(dataUrl);
        }
      });
    });
  }

  public async closeWindow(windowId: number): Promise<void> {
    return new Promise((resolve) => {
      chrome.windows.remove(windowId, () => {
        void chrome.runtime.lastError; // Ignore runtime errors
        resolve();
      });
    });
  }

  public onTabUpdated(callback: (tabId: number, status: 'loading' | 'complete') => void): () => void {
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
      if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
        callback(updatedTabId, changeInfo.status);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    return () => chrome.tabs.onUpdated.removeListener(listener);
  }
}
