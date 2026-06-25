import type { BrowserService } from './BrowserService';

export class ClientBrowserService implements BrowserService {
  public getFaviconUrl(pageUrl: string, size: number): string {
    const url = new URL(pageUrl);

    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${size}`;
  }

  public async createPopup(): Promise<{ id: number; tabId: number }> {
    throw new Error(
      'createPopup is not supported in normal browsers.'
    );
  }

  public async captureVisibleTab(): Promise<string> {
    throw new Error(
      'captureVisibleTab is not supported in normal browsers. Use html2canvas or a server-side screenshot service.'
    );
  }

  public async closeWindow(): Promise<void> {
    throw new Error(
      'createPopup is not supported in normal browsers.'
    );
  }

  public onTabUpdated(): () => void {
    throw new Error(
      'onTabUpdated is not supported in normal browsers.'
    );
  }
}