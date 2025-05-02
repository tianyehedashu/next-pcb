import { FormPersistor } from "./persist";

export function createLocalStoragePersistor<T>(key: string): FormPersistor<T> {
  return {
    save(data: T) {
      localStorage.setItem(key, JSON.stringify(data));
    },
    load() {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    clear() {
      localStorage.removeItem(key);
    }
  };
} 