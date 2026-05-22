import type { Bookmark } from './types';
import { saveThumbnailAction } from './state';

async function resizeImageToDataURL(imageUrl: string, maxDim: number = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Only set crossOrigin for external HTTP/HTTPS URLs to avoid CORS issues
    // or security policy blocks with chrome-extension:// or data: URLs
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2d context');
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

export async function fetchThumbnail(url: string): Promise<string> {
  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  const hasTabsApi = isExtension && !!chrome.windows && !!chrome.tabs;

  let imageUrl = '';
  if (hasTabsApi) {
    try {
      console.log('Attempting Chrome API capture for:', url);
      const dataUrl = await captureWithChromeAPI(url);
      return await resizeImageToDataURL(dataUrl, 256);
    } catch (e: unknown) {
      console.error('Chrome API capture failed, falling back to Favicon API:', e);
      imageUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=256`;
    }
  } else {
    console.error('Chrome API not available, using fallback for:', url);
    if (isExtension) {
      imageUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=256`;
    } else {
      // Use Microlink as the primary public screenshot API because it natively supports CORS
      try {
        console.log('Fetching screenshot from Microlink for:', url);
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot`);
        if (!res.ok) {
          throw new Error(`Microlink returned status ${res.status}`);
        }
        const data = await res.json() as { url?: string };
        if (data && data.url) {
          imageUrl = data.url;
        } else {
          throw new Error('Invalid response from Microlink');
        }
      } catch (err) {
        console.warn('Microlink fetch failed, falling back to WordPress mshots:', err);
        // Direct return WordPress mshots to avoid CORS console errors
        return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=300`;
      }
    }
  }

  try {
    return await resizeImageToDataURL(imageUrl, 256);
  } catch (err) {
    console.warn('Failed to load or resize primary fallback image:', err);

    // Secondary fallback for non-extension environments (WordPress mshots)
    // We return the URL directly, letting the browser's <img> tag render it safely without CORS restrictions.
    if (!isExtension) {
      const wpUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=300`;
      console.log('Falling back to WordPress mshots:', wpUrl);
      return wpUrl;
    }

    return imageUrl;
  }
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
