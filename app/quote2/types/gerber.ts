export interface GerberAnalysisResult {
  dimensions?: {
    width: number;
    height: number;
    unit: 'mm' | 'inch';
  };
  layers?: number;
  drillCount?: number;
  hasGoldFingers?: boolean;
  hasVias?: boolean;
  minTraceWidth?: number;
  minHoleSize?: number;
  fileTypes?: string[];
  errors?: string[];
  warnings?: string[];
  topLayerSvg?: string;
  bottomLayerSvg?: string;
  svgContent?: string;
  // 新增工艺参数
  copperThickness?: {
    outer: number; // 外层铜厚 (oz)
    inner: number; // 内层铜厚 (oz)
    unit: 'oz' | 'um';
  };
  boardThickness?: {
    estimated: number;
    unit: 'mm';
    confidence: 'high' | 'medium' | 'low';
  };
  surfaceFinish?: {
    type: 'HASL' | 'Lead-free HASL' | 'OSP' | 'ENIG' | 'Hard Gold' | 'Immersion Silver' | 'Unknown';
    confidence: 'high' | 'medium' | 'low';
  };
  stencilThickness?: {
    thickness: number;
    unit: 'mm';
    confidence: 'high' | 'medium' | 'low';
  };
  impedanceControl?: {
    hasControlledImpedance: boolean;
    differentialPairs: number;
    singleEndedTraces: number;
  };
  hdiFeatures?: {
    isHDI: boolean;
    microVias: number;
    buriedVias: number;
    blindVias: number;
    viaInPad: boolean;
  };
  designComplexity?: {
    level: 'Simple' | 'Medium' | 'Complex' | 'Advanced';
    factors: string[];
  };
  fabricationNotes?: {
    recommendations: string[];
    warnings: string[];
    specialRequirements: string[];
  };
  costFactors?: {
    panelUtilization: number;
    toolingComplexity: 'Low' | 'Medium' | 'High';
    manufactureTime: 'Standard' | 'Extended' | 'Rush';
  };
  // 阻焊层检测
  solderMask?: {
    hasTopMask: boolean;
    hasBottomMask: boolean;
    color: 'Green' | 'Red' | 'Blue' | 'Black' | 'White' | 'Yellow' | 'Purple' | 'Unknown';
    openings: number; // 开窗数量
    coverage: number; // 覆盖率百分比
  };
  // 丝印层检测
  silkScreen?: {
    hasTopSilk: boolean;
    hasBottomSilk: boolean;
    color: 'White' | 'Black' | 'Yellow' | 'Red' | 'Blue' | 'Unknown';
    textElements: number; // 文本元素数量
    referenceDesignators: number; // 参考标识符数量
    hasLogo: boolean;
  };
}

export interface FileUploadState {
  file: File | null;
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
  uploadUrl: string | null;
  analysisResult?: GerberAnalysisResult | null;
  thumbnail?: string | null;
  isGeneratingThumbnail?: boolean;
  isAnalyzing: boolean;
}

export interface GerberParseState {
  unit: 'mm' | 'inch';
  formatSpec: { integer: number; decimal: number };
  apertures: Map<string, { type: string; size: number; params?: number[]; description?: string }>;
  currentAperture: string | null;
  coordinates: { x: number; y: number }[];
  paths: Array<{ points: { x: number; y: number }[]; aperture: string; type: 'line' | 'arc' | 'flash' | 'region' }>;
  drills: { x: number; y: number; size: number; tool?: string }[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  regions: Array<{ points: { x: number; y: number }[] }>;
  layerType?: string;
  traceCount: number;
  padCount: number;
  viaCount: number;
  debugInfo: string[];
}

export interface JSZipFileEntry {
  dir: boolean;
  async(type: 'text'): Promise<string>;
} 