import { StorageProvider } from './storage-interface';
import { FilesystemStorageProvider } from './filesystem-provider';

/**
 * Factory for creating storage providers
 * This allows us to easily switch between different storage providers
 */
export class StorageFactory {
  /**
   * Get a storage provider instance
   * @param type The type of storage provider to get
   * @returns A storage provider instance
   */
  static getProvider(type: 'filesystem' | 's3' = 'filesystem'): StorageProvider {
    switch (type) {
      case 'filesystem':
        return new FilesystemStorageProvider();
      case 's3':
        // In the future, we could implement an S3 provider
        throw new Error('S3 storage provider not implemented yet');
      default:
        return new FilesystemStorageProvider();
    }
  }
}
