import { FormPersistor } from "./persist";
import { useQuoteStore } from "@/lib/quoteStore";

export function createZustandPersistor<T>(): FormPersistor<T> {
  return {
    save(data: T) {
      useQuoteStore.getState().setForm(data);
    },
    load() {
      return useQuoteStore.getState().form as T;
    },
    clear() {
      useQuoteStore.getState().clearForm();
    }
  };
} 