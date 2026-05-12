import type { Bookmark } from './types';
import { saveThumbnailAction } from './state';

export async function fetchThumbnail(url: string): Promise<string> {
  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  const hasTabsApi = isExtension && !!chrome.windows && !!chrome.tabs;

  if (hasTabsApi) {
    try {
      console.log('Attempting Chrome API capture for:', url);
      return await captureWithChromeAPI(url);
    } catch (e: any) {
      console.error('Chrome API capture failed, falling back to Favicon API:', e);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=128`;
    }
  }

  console.error('Chrome API not available, using fallback for:', url);
  if (isExtension) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=128`;
  }
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=300`;
}

async function captureWithChromeAPI(url: string): Promise<string> {
  console.log('captureWithChromeAPI started for:', url);
  return new Promise((resolve, reject) => {
    // Create a hidden/unfocused window to capture the screenshot
    chrome.windows.create({
      url,
      focused: true,
      type: 'popup',
      width: 640,
      height: 480,
    }, (window) => {
      console.log('chrome.windows.create callback fired for:', url, window);
      if (chrome.runtime.lastError || !window || !window.id || !window.tabs || window.tabs.length === 0) {
        console.error('chrome.windows.create error:', chrome.runtime.lastError);
        return reject(chrome.runtime.lastError || 'Failed to create window');
      }

      const windowId = window.id;
      const tabId = window.tabs[0].id!;

      const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          console.log('Tab load complete for:', url);
          chrome.tabs.onUpdated.removeListener(onUpdated);

          // Wait a bit for the page to actually render after 'complete'
          setTimeout(() => {
            chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 40 }, (dataUrl) => {
              chrome.windows.remove(windowId);
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(dataUrl);
              }
            });
          }, 3000);
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Safety timeout after 20 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.windows.remove(windowId, () => {
          void chrome.runtime.lastError;
        });
        reject('Capture timeout');
      }, 20000);
    });
  });
}

export async function generateThumbnailForBookmark(bookmark: Bookmark) {
  const thumbUrl = await fetchThumbnail(bookmark.url);
  await saveThumbnailAction(bookmark.id, thumbUrl);
}

export async function batchGenerateThumbnails(bookmarks: Bookmark[], onProgress?: (count: number) => void) {
  let count = 0;
  for (const bookmark of bookmarks) {
    await generateThumbnailForBookmark(bookmark);
    count++;
    if (onProgress) onProgress(count);
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
