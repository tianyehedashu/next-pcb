import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  tg: "TG130",
  panelCount: 1,
  shipmentType: "single",
  singleLength: "10",
  singleWidth: "10",
  singleCount: 10,
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
  country: "",
  state: "",
  city: "",
  zip: "",
  phone: "",
  email: "",
  address: "",
  courier: "",
  pcbFile: null as File | null,
  gerberUrl: "",
  declarationMethod: "",
  taxId: "",
  personalId: "",
  purpose: "",
  declaredValue: "",
  companyName: "",
  customsNote: "",
  pcbNote: "",
  userNote: "",
};

interface QuoteState {
  form: any;
  setForm: (form: any) => void;
  clearForm: () => void;
}

export const useQuoteStore = create(
  persist<QuoteState>(
    (set) => ({
      form: defaultForm,
      setForm: (updater: any) =>
        set((state) => ({
          form: typeof updater === "function"
            ? { ...state.form, ...updater(state.form) }
            : { ...state.form, ...updater }
        })),
      clearForm: () => set(() => ({ form: { ...defaultForm } })),
    }),
    { name: "quote-store" }
  )
); 