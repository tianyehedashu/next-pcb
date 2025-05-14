import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { TestMethod } from "@/types/form";

const defaultForm = {
  pcbType: "fr4",
  layers: 2,
  thickness: 1.6,
  surfaceFinish: "hasl",
  copperWeight: "1",
  minTrace: "6/6",
  minHole: "0.2",
  solderMask: "green",
  silkscreen: "white",
  goldFingers: false,
  castellated: false,
  impedance: false,
  flyingProbe: "no",
  quantity: 10,
  delivery: "standard",
  gerber: null as File | null,
  hdi: "none",
  tg: "TG130",
  panelCount: 1,
  shipmentType: "single",
  singleLength: 10,
  singleWidth: 10,
  singleCount: 10,
  border: "5",
  maskCover: "cover",
  edgePlating: false,
  halfHole: "none",
  edgeCover: "none",
  testMethod: TestMethod.FlyingProbe,
  prodCap: "auto",
  productReport: ["none"],
  rejectBoard: "accept",
  yyPin: false,
  customerCode: "none",
  payMethod: "auto",
  qualityAttach: "standard",
  smt: false,
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
} as PcbQuoteForm;

interface QuoteState {
  form: PcbQuoteForm;
  setForm: (form: Partial<PcbQuoteForm>) => void;
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