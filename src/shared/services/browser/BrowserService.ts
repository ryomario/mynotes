export interface BrowserService {
  captureVisibleTab(windowId: number): Promise<string>;
  createPopup(url: string, width: number, height: number): Promise<{ id: number; tabId: number }>;
  closeWindow(windowId: number): Promise<void>;
  getFaviconUrl(pageUrl: string, size: number): string;
  onTabUpdated(callback: (tabId: number, status: 'loading' | 'complete') => void): () => void;
}
