export interface FormPersistor<T> {
  save(data: T): void;
  load(): T | null;
  clear(): void;
} 