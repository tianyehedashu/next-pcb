import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { TestMethod, SurfaceFinish, PcbType, HdiType, TgType, BorderType, CopperWeight, MinTrace, MinHole, SolderMask, Silkscreen, MaskCover, ProdCap, CustomerCode, PayMethod, QualityAttach, 
  ShipmentType, 
  HalfHole,
  EdgeCover,
  ProductReport,
  InnerCopperWeight,
  SurfaceFinishEnigType,
  WorkingGerber,
  CrossOuts,
  IPCClass,
  IfDataConflicts} from "../types/form";

const defaultForm = {
  pcbType: PcbType.FR4,
  layers: 2,
  thickness: 1.6,
  surfaceFinish: SurfaceFinish.HASL,
  surfaceFinishEnigType: SurfaceFinishEnigType.Enig1u,
  outerCopperWeight: CopperWeight.One,
  innerCopperWeight: InnerCopperWeight.Half,
  minTrace: MinTrace.SixSix,
  minHole: MinHole.ZeroTwo,
  solderMask: SolderMask.Green,
  silkscreen: Silkscreen.White,
  goldFingers: false,
  differentDesignsCount: 1,
  castellated: false,
  impedance: false,
  quantity: 10,
  delivery: "standard",
  gerber: null as File | null,
  hdi: HdiType.None,
  tg: TgType.TG135,
  panelCount: 1,
  shipmentType: ShipmentType.Single,
  singleDimensions: { length: 5, width: 5 },
  panelDimensions: { row: 1, column: 1 },
  singleCount: 10,
  panelSet: 10,
  border: BorderType.None,
  maskCover: MaskCover.TentedVias,
  edgePlating: false,
  halfHole: HalfHole.None,
  edgeCover: EdgeCover.None,
  testMethod: TestMethod.FlyingProbe,
  prodCap: ProdCap.Auto,
  productReport: [ProductReport.None],
  rejectBoard: false,
  yyPin: false,
  customerCode: CustomerCode.None,
  payMethod: PayMethod.Auto,
  qualityAttach: QualityAttach.Standard,
  useShengyiMaterial: false,
  bga: false,
  holeCu25um: false,
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
  shippingAddress: {
    name: "",
    phone: "",
    country: "",
    province: "",
    city: "",
    district: "",
    address: "",
    zipCode: "",
  },
  workingGerber: WorkingGerber.NotRequired,
  crossOuts: CrossOuts.NotAccept,
  ipcClass: IPCClass.Level2,
  ifDataConflicts: IfDataConflicts.FollowOrder,
  specialRequests: '',
} as PcbQuoteForm;

interface QuoteState {
  form: PcbQuoteForm;
  setForm: (form: Partial<PcbQuoteForm> | ((form: PcbQuoteForm) => Partial<PcbQuoteForm>)) => void;
  clearForm: () => void;
}

export const useQuoteStore = create(
  persist<QuoteState>(
    (set) => ({
      form: defaultForm,
      setForm: (updater: Partial<PcbQuoteForm> | ((form: PcbQuoteForm) => Partial<PcbQuoteForm>)) =>
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