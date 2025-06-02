/**
 * Storage provider interface for document library
 * This abstraction allows us to easily switch between different storage providers
 * (filesystem, S3, etc.) in the future
 */

export interface DocumentMetadata {
  id: string;
  fileName: string;
  title: string;
  documentType: string;
  uploadDate: Date;
  size: number;
  path: string;
  
  // PDF.co related fields
  pdf_co_url?: string;
  pdf_co_id?: string;
  file_size_kb?: number;
}

export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param file The file to upload
   * @param metadata Additional metadata about the file
   * @returns The metadata of the uploaded file
   */
  uploadFile(file: File, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata>;

  /**
   * Get a file from storage
   * @param id The ID of the file to get
   * @returns The file data
   */
  getFile(id: string): Promise<Blob>;

  /**
   * Delete a file from storage
   * @param id The ID of the file to delete
   * @returns Whether the deletion was successful
   */
  deleteFile(id: string): Promise<boolean>;

  /**
   * List all files in storage
   * @returns Array of file metadata
   */
  listFiles(): Promise<DocumentMetadata[]>;
}
