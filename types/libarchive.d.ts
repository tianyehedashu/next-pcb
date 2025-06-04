declare module 'libarchive.js/dist/libarchive.js' {
  export interface ArchiveOptions {
    workerUrl?: string;
  }
  
  export interface ArchiveEntry {
    path: string;
    size: number;
    type: string;
    lastModified: number;
    fileData: ArrayBuffer;
    fileName: string;
  }
  
  export interface ArchiveReader {
    getFilesArray(): Promise<ArchiveEntry[]>;
    extractSingleFile(path: string): Promise<File>;
    close(): Promise<void>;
  }
  
  export class Archive {
    static init(options?: ArchiveOptions): void;
    static open(file: File): Promise<ArchiveReader>;
  }
} 