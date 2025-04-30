import { create } from "zustand";

const defaultForm = {
  pcbType: "fr4",
  layers: 2,
  thickness: "1.6",
  surfaceFinish: "hasl",
  copperWeight: "1",
  minTrace: "6/6",
  minHole: "0.2",
  solderMask: "green",
  silkscreen: "white",
  goldFingers: "no",
  castellated: "no",
  impedance: "no",
  flyingProbe: "no",
  quantity: 10,
  delivery: "standard",
  gerber: null as File | null,
  hdi: "none",
  tg: "TG170",
  panelCount: 1,
  shipmentType: "single",
  singleLength: "10",
  singleWidth: "10",
  singleCount: "10",
  border: "5",
  maskCover: "cover",
  edgePlating: "no",
  halfHole: "none",
  edgeCover: "none",
  testMethod: "free",
  prodCap: "auto",
  productReport: ["none"],
  rejectBoard: "accept",
  yyPin: "none",
  customerCode: "none",
  payMethod: "auto",
  qualityAttach: "standard",
  smt: "none",
};

interface QuoteState {
  form: any;
  setForm: (form: any) => void;
  clearForm: () => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  form: defaultForm,
  setForm: (updater: any) =>
    set((state) => ({
      form: typeof updater === "function"
        ? { ...state.form, ...updater(state.form) }
        : { ...state.form, ...updater }
    })),
  clearForm: () => set(() => ({ form: { ...defaultForm } })),
})); 