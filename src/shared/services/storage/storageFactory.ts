import type { StorageService } from './StorageService';
import { IndexedDBStorageService } from './IndexedDBStorageService';
import { LocalStorageStorageService } from './LocalStorageStorageService';
import { ChromeApiStorageService } from './ChromeApiStorageService';

let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const type = import.meta.env.VITE_STORAGE_TYPE || 'localStorage';
  console.log(`Using storage service: ${type}`);

  if (type === 'indexedDB') {
    storageServiceInstance = new IndexedDBStorageService();
  } else if (type === 'chrome-api') {
    storageServiceInstance = new ChromeApiStorageService();
  } else {
    storageServiceInstance = new LocalStorageStorageService();
  }

  return storageServiceInstance;
}
