"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuoteStore, useQuoteFormData } from '@/lib/stores/quote-store';
import { 
  Upload, 
  File,
  X, 
  CheckCircle, 
  RotateCcw, 
  Trash2,
  AlertTriangle, 
  Settings
} from 'lucide-react';
import JSZip from 'jszip';

// 动态导入 libarchive.js (只在需要时导入，避免SSR问题)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let libarchive: any = null;

// Initialize libarchive.js
const initLibArchive = async () => {
  if (!libarchive && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Archive } = await import('libarchive.js/dist/libarchive.js') as any;
    Archive.init({
      workerUrl: '/worker-bundle.js'
    });
    libarchive = Archive;
  }
  return libarchive;
};

// JSZip 文件条目类型定义
interface JSZipFileEntry {
  dir: boolean;
  async(type: 'text'): Promise<string>;
}

// RAR 文件条目类型定义
interface RarArchiveEntry {
  path?: string;
  name?: string;
  fileName?: string;
  type?: string;
  file?: {
    name?: string;
    type?: string;
  };
}

// Gerber文件解析结果接口
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

interface FileUploadState {
  file: File | null;
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
  uploadUrl: string | null;
  analysisResult?: GerberAnalysisResult | null;
  isAnalyzing?: boolean;
  thumbnail?: string | null;
  isGeneratingThumbnail?: boolean;
  analysisProgress?: {
    current: number;
    total: number;
    currentFile: string;
  };
}

const createInitialState = (): FileUploadState => ({
  file: null,
  fileName: '',
  fileSize: 0,
  uploadProgress: 0,
  uploadStatus: 'idle',
  uploadError: null,
  uploadUrl: null,
  analysisResult: null,
  isAnalyzing: false,
  thumbnail: null,
  isGeneratingThumbnail: false,
  analysisProgress: undefined,
});

// 模拟文件上传API
async function uploadFileToServer(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // 5-20% 每次
      if (progress > 100) progress = 100;
      
      onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // 模拟成功上传，返回URL
        resolve({
          success: true,
          url: `https://storage.nextpcb.com/gerber/${Date.now()}-${file.name}`
        });
      }
    }, 150);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 改进的Gerber解析状态接口
interface GerberParseState {
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

export function FileUploadSection() {
  const [uploadState, setUploadState] = useState<FileUploadState>(createInitialState());
  const [isClient, setIsClient] = useState(false);
  const { updateFormData } = useQuoteStore();
  const formData = useQuoteFormData();

  // 确保组件只在客户端渲染后显示完整内容
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检测Gerber文件类型
  function detectGerberFileType(filename: string, content: string): string {
    const lowerFilename = filename.toLowerCase();
    
    // 获取文件扩展名（不区分大小写）
    const getFileExtension = (fname: string): string => {
      const lastDot = fname.lastIndexOf('.');
      return lastDot !== -1 ? fname.substring(lastDot).toLowerCase() : '';
    };
    
    const extension = getFileExtension(filename);
    
    // 调试输出
    console.log(`🔍 Detecting file: ${filename}`);
    console.log(`📄 Extension: "${extension}"`);
    console.log(`🔤 Lower filename: ${lowerFilename}`);
    
    // 顶层走线 (Top Copper) - 不区分大小写
    if (extension === '.gtl' || 
        extension === '.cmp' || 
        extension === '.top' ||
        extension === '.1' ||
        lowerFilename.includes('top') && lowerFilename.includes('copper') ||
        lowerFilename.includes('layer1') ||
        lowerFilename.includes('component') ||
        lowerFilename.includes('front')) {
      return 'Top Copper';
    }

    // 底层走线 (Bottom Copper) - 不区分大小写
    if (extension === '.gbl' || 
        extension === '.sol' || 
        extension === '.bottom' ||
        extension === '.bot' ||
        extension === '.2' ||
        lowerFilename.includes('bottom') && lowerFilename.includes('copper') ||
        lowerFilename.includes('solder') && lowerFilename.includes('side') ||
        lowerFilename.includes('layer2')) {
      return 'Bottom Copper';
    }

    // 钻孔文件 (Drill Files) - 不区分大小写
    if (extension === '.drl' || 
        extension === '.drill' || 
        extension === '.txt' && (lowerFilename.includes('drill') || lowerFilename.includes('hole')) ||
        extension === '.exc' ||
        extension === '.xln' ||
        lowerFilename.includes('drill') ||
        lowerFilename.includes('hole')) {
      return 'Drill File';
    }

    // 内层铜箔检测 - 支持各种格式，不区分大小写
    // G层格式：.g1, .g2, .g3, .g4 等
    const gLayerMatch = extension.match(/^\.g(\d+)$/);
    if (gLayerMatch) {
      const layerNum = parseInt(gLayerMatch[1]);
      if (layerNum >= 1 && layerNum <= 32) {
        return `Inner Copper Layer G${layerNum}`;
      }
    }
    
    // 数字层格式：.3, .4, .5 等
    const numLayerMatch = extension.match(/^\.(\d+)$/);
    if (numLayerMatch) {
      const layerNum = parseInt(numLayerMatch[1]);
      if (layerNum >= 3 && layerNum <= 32) {
        return `Inner Copper Layer ${layerNum}`;
      }
    }
    
    // CAD软件通用格式检测
    const internalLayerPatterns = [
      /inner.*layer.*(\d+)/i,
      /layer.*(\d+).*inner/i,
      /internal.*(\d+)/i,
      /plane.*(\d+)/i,
      /power.*(\d+)/i,
      /ground.*(\d+)/i,
      /signal.*(\d+)/i
    ];
    
    for (const pattern of internalLayerPatterns) {
      const match = filename.match(pattern);
      if (match) {
        const layerNum = parseInt(match[1]);
        if (layerNum >= 3 && layerNum <= 32) {
          return `Inner Copper Layer ${layerNum}`;
        }
      }
    }
    
    // Digital.G4 这样的格式检测 - 不区分大小写
    const digitalLayerMatch = filename.match(/digital\.g(\d+)$/i) || filename.match(/\.g(\d+)$/i);
    if (digitalLayerMatch) {
      const layerNum = parseInt(digitalLayerMatch[1]);
      if (layerNum >= 3 && layerNum <= 32) {
        return `Inner Copper Layer ${layerNum}`;
      } else if (layerNum === 1) {
        return 'Top Copper';
      } else if (layerNum === 2) {
        return 'Bottom Copper';
      }
    }
    
    // 通用内层标识
    if (lowerFilename.includes('inner') && lowerFilename.includes('copper') ||
        lowerFilename.includes('internal') ||
        lowerFilename.includes('plane') ||
        lowerFilename.includes('power') ||
        lowerFilename.includes('ground')) {
      return 'Inner Copper';
    }
    
    // 阻焊层 (Solder Mask) - 不区分大小写
    if (extension === '.gts' || 
        lowerFilename.includes('soldermask') && lowerFilename.includes('top') ||
        lowerFilename.includes('mask') && lowerFilename.includes('top')) {
      return 'Top Solder Mask';
    }
    if (extension === '.gbs' || 
        lowerFilename.includes('soldermask') && lowerFilename.includes('bottom') ||
        lowerFilename.includes('mask') && lowerFilename.includes('bottom')) {
      return 'Bottom Solder Mask';
    }
    if (lowerFilename.includes('mask') && !lowerFilename.includes('paste') ||
        lowerFilename.includes('soldermask') ||
        content.includes('%FSLAX') && content.includes('APERTURE')) {
      return 'Solder Mask';
    }
    
    // 丝印层 (Silk Screen) - 不区分大小写
    if (extension === '.gto' || 
        lowerFilename.includes('silkscreen') && lowerFilename.includes('top') ||
        lowerFilename.includes('silk') && lowerFilename.includes('top') ||
        lowerFilename.includes('legend') && lowerFilename.includes('top')) {
      return 'Top Silk Screen';
    }
    if (extension === '.gbo' || 
        lowerFilename.includes('silkscreen') && lowerFilename.includes('bottom') ||
        lowerFilename.includes('silk') && lowerFilename.includes('bottom') ||
        lowerFilename.includes('legend') && lowerFilename.includes('bottom')) {
      return 'Bottom Silk Screen';
    }
    if (lowerFilename.includes('silk') || lowerFilename.includes('legend')) {
      return 'Silk Screen';
    }

    // 助焊层/锡膏层 (Paste Mask) - 不区分大小写
    if (extension === '.gtp' || 
        lowerFilename.includes('paste') && lowerFilename.includes('top')) {
      return 'Top Paste Mask';
    }
    if (extension === '.gbp' || 
        lowerFilename.includes('paste') && lowerFilename.includes('bottom')) {
      return 'Bottom Paste Mask';
    }
    if (lowerFilename.includes('paste')) {
      return 'Paste Mask';
    }

    // 机械层/外形层 (Mechanical/Outline) - 不区分大小写
    if (extension === '.gko' || 
        extension === '.gm1' || 
        extension === '.outline' ||
        extension === '.oln' ||
        lowerFilename.includes('outline') || 
        lowerFilename.includes('mechanical') || 
        lowerFilename.includes('board') && lowerFilename.includes('outline') ||
        lowerFilename.includes('mill') ||
        lowerFilename.includes('route') ||
        lowerFilename.includes('edge') && lowerFilename.includes('cut')) {
      return 'Mechanical/Outline';
    }

    // 禁布层 (Keep Out Layer) - 不区分大小写
    if (lowerFilename.includes('keepout') || 
        lowerFilename.includes('keep') && lowerFilename.includes('out') ||
        lowerFilename.includes('restricted') ||
        lowerFilename.includes('no') && lowerFilename.includes('copper')) {
      return 'Keep Out Layer';
    }

    // 装配图层 (Assembly) - 不区分大小写
    if (extension === '.gta' || 
        extension === '.gba' ||
        lowerFilename.includes('assembly') || 
        lowerFilename.includes('asm') ||
        lowerFilename.includes('fabrication') && lowerFilename.includes('drawing')) {
      return 'Assembly Layer';
    }

    // 取放文件 (Pick and Place) - 不区分大小写
    if (extension === '.pos' || 
        extension === '.place' ||
        extension === '.pnp' ||
        lowerFilename.includes('pick') && lowerFilename.includes('place') ||
        lowerFilename.includes('placement') ||
        lowerFilename.includes('centroid') ||
        lowerFilename.includes('component') && lowerFilename.includes('position')) {
      return 'Pick and Place';
    }

    // 物料清单 (Bill of Materials) - 不区分大小写
    if (extension === '.bom' || 
        extension === '.csv' && lowerFilename.includes('bom') ||
        extension === '.xlsx' && lowerFilename.includes('bom') ||
        lowerFilename.includes('bill') && lowerFilename.includes('material') ||
        lowerFilename.includes('component') && lowerFilename.includes('list')) {
      return 'Bill of Materials';
    }

    // 测试点 (Test Points) - 不区分大小写
    if (lowerFilename.includes('test') && lowerFilename.includes('point') ||
        lowerFilename.includes('testpoint') ||
        lowerFilename.includes('probe') ||
        lowerFilename.includes('fixture')) {
      return 'Test Points';
    }

    // 通过文件内容检测Gerber文件类型
    if (content.includes('%FSLAX') || content.includes('G04 ') || content.includes('M02*')) {
      return 'Gerber File';
    }

    // Excellon钻孔文件检测
    if (content.includes('M48') || content.includes('T01') || content.includes('M30')) {
      return 'Drill File';
    }

    // 如果没有内容，完全基于扩展名判断
    if (!content || content.trim() === '') {
      // 强制基于扩展名的识别逻辑
      if (extension === '.gtl') return 'Top Copper';
      if (extension === '.gbl') return 'Bottom Copper';
      if (extension === '.gts') return 'Top Solder Mask';
      if (extension === '.gbs') return 'Bottom Solder Mask';
      if (extension === '.gto') return 'Top Silk Screen';
      if (extension === '.gbo') return 'Bottom Silk Screen';
      if (extension === '.gtp') return 'Top Paste Mask';
      if (extension === '.gbp') return 'Bottom Paste Mask';
      if (extension === '.gm1') return 'Mechanical/Outline';
      if (extension === '.gko') return 'Mechanical/Outline';
      if (extension === '.drl' || extension === '.drr') return 'Drill File';
      if (extension === '.txt') return 'Drill File';
      if (extension === '.rep') return 'Drill Report';
      if (extension === '.rul') return 'Design Rules';
      if (extension === '.ldp') return 'Layer Description';
      if (extension === '.extrep') return 'Extraction Report';
      if (extension === '.apr') return 'Aperture File';
      if (extension === '.apr_lib') return 'Aperture Library';
      
      // G层格式强制识别
      const gMatch = extension.match(/^\.g(\d+)$/);
      if (gMatch) {
        const num = parseInt(gMatch[1]);
        if (num === 1) return 'Top Copper';
        if (num === 2) return 'Bottom Copper';
        if (num >= 3 && num <= 32) return `Inner Copper Layer G${num}`;
      }
      
      // TX层格式
      if (extension.match(/^\.tx\d+$/)) return 'Text Layer';
    }

    return 'Unknown';
  }

  // 解析钻孔文件 - 改进版本
  const parseDrillFile = useCallback((content: string): { drills: { x: number; y: number; size: number; tool?: string }[]; unit: 'mm' | 'inch'; debugInfo: string[] } => {
    const drills: { x: number; y: number; size: number; tool?: string }[] = [];
    let unit: 'mm' | 'inch' = 'mm';
    const tools = new Map<string, { size: number; count: number }>();
    let currentTool: string | null = null;
    const debugInfo: string[] = [];
    let formatSpec = { integer: 3, decimal: 3 };

    const lines = content.split(/\r?\n/);
    debugInfo.push(`Parsing drill file with ${lines.length} lines`);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('%')) continue;

      // 检测单位 - 更全面的检测
      if (trimmedLine.includes('INCH') || trimmedLine.includes('M72') || trimmedLine.includes('IMPERIAL')) {
        unit = 'inch';
        debugInfo.push('Unit detected: INCH');
        continue;
      }
      if (trimmedLine.includes('METRIC') || trimmedLine.includes('M71') || trimmedLine.includes('MM')) {
        unit = 'mm';
        debugInfo.push('Unit detected: METRIC');
        continue;
      }

      // 检测格式规范
      const formatMatch = trimmedLine.match(/^(FMAT|FORMAT).*?([0-9]+):([0-9]+)/i);
      if (formatMatch) {
        formatSpec = {
          integer: parseInt(formatMatch[2]),
          decimal: parseInt(formatMatch[3])
        };
        debugInfo.push(`Format detected: ${formatSpec.integer}.${formatSpec.decimal}`);
        continue;
      }

      // 解析工具定义 - 支持多种格式
      // T1C0.2000, T01C0.008, T1F00S00C0.0135等
      const toolMatch = trimmedLine.match(/T(\d+)(?:F\d+S\d+)?C([0-9.]+)/i);
      if (toolMatch) {
        const [, toolId, sizeStr] = toolMatch;
        const size = parseFloat(sizeStr);
        tools.set(toolId, { size, count: 0 });
        debugInfo.push(`Tool T${toolId} defined: ${size}${unit}`);
        continue;
      }

      // 解析工具选择 T1, T01, T001等
      const toolSelectMatch = trimmedLine.match(/^T(\d+)$/);
      if (toolSelectMatch) {
        currentTool = toolSelectMatch[1];
        debugInfo.push(`Tool selected: T${currentTool}`);
        continue;
      }

      // 解析钻孔坐标 - 支持多种格式
      // X1000Y2000, X+001000Y+002000, X1.0000Y2.0000等
      const drillMatch = trimmedLine.match(/X([+-]?[0-9.]+)Y([+-]?[0-9.]+)/i);
      if (drillMatch && currentTool) {
        const [, xStr, yStr] = drillMatch;
        let x = parseFloat(xStr);
        let y = parseFloat(yStr);
        
        // 根据格式和数值范围判断是否需要单位转换
        if (Math.abs(x) > 100 || Math.abs(y) > 100) {
          // 可能是整数格式，需要除以适当的因子
          const divisor = Math.pow(10, formatSpec.decimal);
          x = x / divisor;
          y = y / divisor;
        }
        
        const toolInfo = tools.get(currentTool);
        const size = toolInfo ? toolInfo.size : 0.2;
        
        drills.push({ x, y, size, tool: `T${currentTool}` });
        
        // 更新工具使用计数
        if (toolInfo) {
          toolInfo.count++;
        }
      }
    }

    debugInfo.push(`Total drills parsed: ${drills.length}`);
    debugInfo.push(`Tools used: ${Array.from(tools.entries()).map(([id, info]) => `T${id}(${info.size}${unit}, ${info.count}x)`).join(', ')}`);

    return { drills, unit, debugInfo };
  }, []);

  // 改进的Gerber文件解析算法 - 更精确的版本
  const parseAdvancedGerberFile = useCallback((content: string): GerberParseState => {
    const state: GerberParseState = {
      unit: 'mm',
      formatSpec: { integer: 3, decimal: 3 },
      apertures: new Map(),
      currentAperture: null,
      coordinates: [],
      paths: [],
      drills: [],
      bounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      regions: [],
      traceCount: 0,
      padCount: 0,
      viaCount: 0,
      debugInfo: []
    };

    const lines = content.split(/\r?\n/);
    state.debugInfo.push(`Processing ${lines.length} lines`);
    
    let currentX = 0, currentY = 0;
    let interpolationMode = 'G01'; // 默认线性插值
    let isInRegion = false;
    let regionPoints: { x: number; y: number }[] = [];
    let formatParsed = false;
    let unitParsed = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%') && trimmed.endsWith('%')) {
        // 处理参数块
        if (trimmed.includes('FSLAX') || trimmed.includes('FSLAY')) {
          // 格式规范：%FSLAX23Y23*% 表示前导零抑制，X和Y都是2.3格式
          const formatMatch = trimmed.match(/FSLA[XY](\d)(\d)[XY](\d)(\d)/);
          if (formatMatch) {
            state.formatSpec = {
              integer: parseInt(formatMatch[1]),
              decimal: parseInt(formatMatch[2])
            };
            formatParsed = true;
            state.debugInfo.push(`Format spec: ${state.formatSpec.integer}.${state.formatSpec.decimal}`);
          }
        }
        
        // 单位声明
        if (trimmed.includes('MOMM')) {
          state.unit = 'mm';
          unitParsed = true;
          state.debugInfo.push('Unit: mm');
        } else if (trimmed.includes('MOIN')) {
          state.unit = 'inch';  
          unitParsed = true;
          state.debugInfo.push('Unit: inch');
        }
        
        // 光圈定义 - 改进版本
        const apertureMatch = trimmed.match(/%ADD(\d+)([CROP])[,]?([^*]*)\*%/);
        if (apertureMatch) {
          const [, apertureId, type, params] = apertureMatch;
          const paramArray = params ? params.split(',').map(p => parseFloat(p)) : [];
          
          let apertureType = 'unknown';
          let size = 0;
          let description = '';
          
          switch (type) {
            case 'C':
              apertureType = 'circle';
              size = paramArray[0] || 0;
              description = `Circle Ø${size}`;
              break;
            case 'R':
              apertureType = 'rectangle';
              size = Math.min(paramArray[0] || 0, paramArray[1] || 0);
              description = `Rectangle ${paramArray[0]}×${paramArray[1]}`;
              break;
            case 'O':
              apertureType = 'oval';
              size = Math.min(paramArray[0] || 0, paramArray[1] || 0);
              description = `Oval ${paramArray[0]}×${paramArray[1]}`;
              break;
            case 'P':
              apertureType = 'polygon';
              size = paramArray[0] || 0;
              description = `Polygon Ø${size}`;
              break;
          }
          
          state.apertures.set(apertureId, {
            type: apertureType,
            size,
            params: paramArray,
            description
          });
          state.debugInfo.push(`Aperture D${apertureId}: ${description}`);
        }
        continue;
      }

      // 处理G代码（图形状态）
      if (trimmed.match(/^G\d+/)) {
        if (trimmed.includes('G01')) interpolationMode = 'G01'; // 线性插值
        else if (trimmed.includes('G02')) interpolationMode = 'G02'; // 顺时针圆弧
        else if (trimmed.includes('G03')) interpolationMode = 'G03'; // 逆时针圆弧
        else if (trimmed.includes('G36')) isInRegion = true; // 开始填充区域
        else if (trimmed.includes('G37')) {
          // 结束填充区域
          if (regionPoints.length > 0) {
            state.regions.push({ points: [...regionPoints] });
            regionPoints = [];
          }
          isInRegion = false;
        }
        continue;
      }

      // 处理D代码（光圈选择）
      if (trimmed.match(/^D\d+\*?$/)) {
        const dMatch = trimmed.match(/D(\d+)/);
        if (dMatch) {
          state.currentAperture = dMatch[1];
        }
        continue;
      }

      // 解析坐标和操作 - 更精确的正则表达式
      const coordMatch = line.match(/(?:X([+-]?\d+))?(?:Y([+-]?\d+))?(?:I([+-]?\d+))?(?:J([+-]?\d+))?(?:D0([123]))?/);
      if (coordMatch) {
        const [, xStr, yStr, , , operation] = coordMatch;
        
        // 更新坐标 - 根据格式规范正确解析
        if (xStr !== undefined) {
          const rawX = parseInt(xStr);
          // 智能单位转换
          if (formatParsed) {
            const divisor = Math.pow(10, state.formatSpec.decimal);
            currentX = rawX / divisor;
          } else {
            // 自动检测格式
            if (Math.abs(rawX) > 100000) {
              currentX = rawX / 100000; // 5位小数格式
            } else if (Math.abs(rawX) > 10000) {
              currentX = rawX / 10000; // 4位小数格式
            } else if (Math.abs(rawX) > 1000) {
              currentX = rawX / 1000; // 3位小数格式
            } else {
              currentX = rawX / 100; // 2位小数格式（默认）
            }
          }
        }
        
        if (yStr !== undefined) {
          const rawY = parseInt(yStr);
          if (formatParsed) {
            const divisor = Math.pow(10, state.formatSpec.decimal);
            currentY = rawY / divisor;
          } else {
            // 自动检测格式
            if (Math.abs(rawY) > 100000) {
              currentY = rawY / 100000;
            } else if (Math.abs(rawY) > 10000) {
              currentY = rawY / 10000;
            } else if (Math.abs(rawY) > 1000) {
              currentY = rawY / 1000;
            } else {
              currentY = rawY / 100;
            }
          }
        }

        // 更新边界
        state.bounds.minX = Math.min(state.bounds.minX, currentX);
        state.bounds.maxX = Math.max(state.bounds.maxX, currentX);
        state.bounds.minY = Math.min(state.bounds.minY, currentY);
        state.bounds.maxY = Math.max(state.bounds.maxY, currentY);

        const currentPoint = { x: currentX, y: currentY };
        state.coordinates.push(currentPoint);

        if (isInRegion) {
          regionPoints.push(currentPoint);
        }

        // 处理操作
        if (operation === '1') {
          // D01 - 插值操作（画线）
          if (state.currentAperture && state.coordinates.length >= 2) {
            const prevPoint = state.coordinates[state.coordinates.length - 2];
            state.paths.push({
              points: [prevPoint, currentPoint],
              aperture: state.currentAperture,
              type: interpolationMode === 'G01' ? 'line' : 'arc'
            });
            state.traceCount++;
          }
        } else if (operation === '2') {
          // D02 - 移动操作（不画线）
          // 只更新位置，不绘制
        } else if (operation === '3') {
          // D03 - 闪光操作（焊盘/过孔）
          if (state.currentAperture) {
            state.paths.push({
              points: [currentPoint],
              aperture: state.currentAperture,
              type: 'flash'
            });
            
            // 判断是焊盘还是过孔 - 更精确的判断
            const aperture = state.apertures.get(state.currentAperture);
            if (aperture) {
              if (aperture.size < 0.5) { // 小于0.5mm的通常是过孔
                state.viaCount++;
              } else if (aperture.size > 2.0) { // 大于2mm的通常是焊盘
                state.padCount++;
              } else {
                // 中等尺寸，需要结合位置和密度判断
                // 简化判断：如果周围有很多相似的闪光点，可能是焊盘
                state.padCount++;
              }
            }
          }
        }
      }

      // 处理钻孔文件格式中的工具定义和坐标
      const drillToolMatch = line.match(/T(\d+)C([0-9.]+)/);
      if (drillToolMatch) {
        const [, toolId, size] = drillToolMatch;
        state.apertures.set(toolId, {
          type: 'circle',
          size: parseFloat(size),
          params: [],
          description: `Drill T${toolId} Ø${size}`
        });
        state.debugInfo.push(`Drill tool T${toolId}: Ø${size}`);
        continue;
      }

      const drillToolSelectMatch = line.match(/^T(\d+)$/);
      if (drillToolSelectMatch) {
        state.currentAperture = drillToolSelectMatch[1];
        continue;
      }

      const drillCoordMatch = line.match(/X([0-9.-]+)Y([0-9.-]+)/);
      if (drillCoordMatch && state.currentAperture) {
        const [, xStr, yStr] = drillCoordMatch;
        let x = parseFloat(xStr);
        let y = parseFloat(yStr);
        
        // 智能单位转换 - 改进版本
        if (!unitParsed) {
          // 根据数值范围推断单位和格式
          if (Math.abs(x) > 100000 || Math.abs(y) > 100000) {
            // 大数值，可能是微米或mil
            if (Math.abs(x) > 1000000) {
              x = x / 1000000; // 微米转毫米
              y = y / 1000000;
              state.unit = 'mm';
            } else {
              x = x / 100000; // mil转英寸
              y = y / 100000;
              state.unit = 'inch';
            }
          } else if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
            const divisor = Math.pow(10, state.formatSpec.decimal);
            x = x / divisor;
            y = y / divisor;
          }
        }
        
        const aperture = state.apertures.get(state.currentAperture);
        const size = aperture ? aperture.size : 0.2;
        
        state.drills.push({ x, y, size, tool: `T${state.currentAperture}` });
        
        // 更新边界
        state.bounds.minX = Math.min(state.bounds.minX, x);
        state.bounds.maxX = Math.max(state.bounds.maxX, x);
        state.bounds.minY = Math.min(state.bounds.minY, y);
        state.bounds.maxY = Math.max(state.bounds.maxY, y);
      }

      // 处理单位声明（钻孔文件）
      if (line.includes('INCH') || line.includes('M72')) {
        state.unit = 'inch';
        continue;
      }
      if (line.includes('METRIC') || line.includes('M71')) {
        state.unit = 'mm';
        continue;
      }
    }

    // 添加统计信息到调试信息
    state.debugInfo.push(`Bounds: (${state.bounds.minX.toFixed(3)}, ${state.bounds.minY.toFixed(3)}) to (${state.bounds.maxX.toFixed(3)}, ${state.bounds.maxY.toFixed(3)}) ${state.unit}`);
    state.debugInfo.push(`Apertures: ${state.apertures.size}, Paths: ${state.paths.length}, Drills: ${state.drills.length}`);
    state.debugInfo.push(`Traces: ${state.traceCount}, Pads: ${state.padCount}, Vias: ${state.viaCount}`);

    // 最终尺寸验证和调整
    if (state.bounds.minX !== Infinity && state.bounds.maxX !== -Infinity) {
      const width = state.bounds.maxX - state.bounds.minX;
      const height = state.bounds.maxY - state.bounds.minY;
      
      // 检查尺寸合理性
      if (state.unit === 'mm') {
        // 毫米单位，PCB尺寸应该在1-1000mm之间
        if (width < 1 || height < 1) {
          state.debugInfo.push(`Warning: Small dimensions (${width.toFixed(2)}×${height.toFixed(2)}mm) - possible unit issue`);
        } else if (width > 1000 || height > 1000) {
          state.debugInfo.push(`Warning: Large dimensions (${width.toFixed(2)}×${height.toFixed(2)}mm) - possible unit issue`);
        }
      } else {
        // 英寸单位，PCB尺寸应该在0.04-40英寸之间
        if (width < 0.04 || height < 0.04) {
          state.debugInfo.push(`Warning: Small dimensions (${width.toFixed(3)}×${height.toFixed(3)}") - possible unit issue`);
        } else if (width > 40 || height > 40) {
          state.debugInfo.push(`Warning: Large dimensions (${width.toFixed(3)}×${height.toFixed(3)}") - possible unit issue`);
        }
      }
    }

    return state;
  }, []);

  // 改进的Gerber内容分析函数
  const analyzeGerberContent = useCallback(async (content: string, filename: string): Promise<GerberAnalysisResult> => {
    const result: GerberAnalysisResult = {
      fileTypes: [],
      errors: [],
      warnings: [],
      fabricationNotes: {
        recommendations: [],
        warnings: [],
        specialRequirements: []
      }
    };

    try {
      // 检测文件类型
      const fileType = detectGerberFileType(filename, content);
      if (fileType) {
        result.fileTypes!.push(fileType);
        
        // 初始化阻焊层和丝印层分析结果
        if (!result.solderMask) {
          result.solderMask = {
            hasTopMask: false,
            hasBottomMask: false,
            color: 'Unknown',
            openings: 0,
            coverage: 90
          };
        }
        
        if (!result.silkScreen) {
          result.silkScreen = {
            hasTopSilk: false,
            hasBottomSilk: false,
            color: 'Unknown',
            textElements: 0,
            referenceDesignators: 0,
            hasLogo: false
          };
        }
        
        // 阻焊层分析
        if (fileType.includes('Solder Mask')) {
          if (fileType.includes('Top')) {
            result.solderMask.hasTopMask = true;
          } else if (fileType.includes('Bottom')) {
            result.solderMask.hasBottomMask = true;
          } else {
            // 通用阻焊层，假设为顶层
            result.solderMask.hasTopMask = true;
          }
          
          // 分析阻焊层内容
          const lines = content.split('\n');
          let openingCount = 0;
          
          for (const line of lines) {
            // 检测开窗 (flash operations)
            if (line.includes('D03') || line.match(/X\d+Y\d+D03/)) {
              openingCount++;
            }
            
            // 检测阻焊颜色线索
            if (line.includes('Green') || line.includes('GREEN')) {
              result.solderMask.color = 'Green';
            } else if (line.includes('Red') || line.includes('RED')) {
              result.solderMask.color = 'Red';
            } else if (line.includes('Blue') || line.includes('BLUE')) {
              result.solderMask.color = 'Blue';
            } else if (line.includes('Black') || line.includes('BLACK')) {
              result.solderMask.color = 'Black';
            } else if (line.includes('White') || line.includes('WHITE')) {
              result.solderMask.color = 'White';
            }
          }
          
          result.solderMask.openings += openingCount;
          
          if (openingCount > 0) {
            result.warnings!.push(`Solder mask openings detected: ${openingCount}`);
          }
        }
        
        // 丝印层分析
        if (fileType.includes('Silk Screen') || fileType.includes('Silkscreen')) {
          if (fileType.includes('Top')) {
            result.silkScreen.hasTopSilk = true;
          } else if (fileType.includes('Bottom')) {
            result.silkScreen.hasBottomSilk = true;
          } else {
            // 通用丝印层，假设为顶层
            result.silkScreen.hasTopSilk = true;
          }
          
          // 分析丝印层内容
          const lines = content.split('\n');
          let textElementCount = 0;
          let referenceDesignatorCount = 0;
          let hasLogo = false;
          
          for (const line of lines) {
            // 检测文本元素
            if (line.includes('G04') && (line.includes('#@') || line.includes('TEXT'))) {
              textElementCount++;
            }
            
            // 检测参考标识符 (R1, C1, U1, IC1等)
            if (line.match(/[RCULDSQ]\d+/) || line.match(/IC\d+/) || line.match(/FB\d+/)) {
              referenceDesignatorCount++;
            }
            
            // 检测可能的Logo
            if (line.includes('LOGO') || line.includes('Logo') || 
                line.includes('BRAND') || line.includes('COPYRIGHT') ||
                line.includes('©') || line.includes('®') || line.includes('™')) {
              hasLogo = true;
            }
            
            // 检测丝印颜色线索
            if (line.includes('White') || line.includes('WHITE')) {
              result.silkScreen.color = 'White';
            } else if (line.includes('Black') || line.includes('BLACK')) {
              result.silkScreen.color = 'Black';
            } else if (line.includes('Yellow') || line.includes('YELLOW')) {
              result.silkScreen.color = 'Yellow';
            }
          }
          
          result.silkScreen.textElements += textElementCount;
          result.silkScreen.referenceDesignators += referenceDesignatorCount;
          if (hasLogo) {
            result.silkScreen.hasLogo = true;
          }
          
          if (textElementCount > 0) {
            result.warnings!.push(`Silk screen text elements detected: ${textElementCount}`);
          }
          if (referenceDesignatorCount > 0) {
            result.warnings!.push(`Reference designators detected: ${referenceDesignatorCount}`);
          }
          if (hasLogo) {
            result.warnings!.push('Logo or branding elements detected in silk screen');
          }
        }
      }

      let dimensions: GerberAnalysisResult['dimensions'];
      let drillCount = 0;
      let hasGoldFingers = false;
      let hasVias = false;
      let minTraceWidth: number | undefined;
      let minHoleSize: number | undefined;

      // 新增工艺参数变量
      let copperThickness: GerberAnalysisResult['copperThickness'];
      let boardThickness: GerberAnalysisResult['boardThickness'];
      let surfaceFinish: GerberAnalysisResult['surfaceFinish'];
      let stencilThickness: GerberAnalysisResult['stencilThickness'];
      let impedanceControl: GerberAnalysisResult['impedanceControl'] = {
        hasControlledImpedance: false,
        differentialPairs: 0,
        singleEndedTraces: 0
      };
      let hdiFeatures: GerberAnalysisResult['hdiFeatures'] = {
        isHDI: false,
        microVias: 0,
        buriedVias: 0,
        blindVias: 0,
        viaInPad: false
      };
      let designComplexity: GerberAnalysisResult['designComplexity'] = {
        level: 'Simple',
        factors: []
      };
      let costFactors: GerberAnalysisResult['costFactors'] = {
        panelUtilization: 85, // 默认估算
        toolingComplexity: 'Low',
        manufactureTime: 'Standard'
      };

      // 检测是否为钻孔文件
      const isDrillFile = filename.toLowerCase().match(/\.(drl|drr|txt|nc|tap|xln)$/) ||
                         content.includes('INCH') && content.includes('T') && content.includes('C') ||
                         content.includes('METRIC') && content.includes('T') && content.includes('C') ||
                         content.includes('M72') || content.includes('M71');

      if (isDrillFile || content.includes('T') && content.includes('C') && content.includes('X') && content.includes('Y')) {
        // 解析钻孔文件
        const drillData = parseDrillFile(content);
        drillCount = drillData.drills.length;
        
        if (drillData.drills.length > 0) {
          // 计算钻孔文件的尺寸
          const minX = Math.min(...drillData.drills.map(d => d.x));
          const maxX = Math.max(...drillData.drills.map(d => d.x));
          const minY = Math.min(...drillData.drills.map(d => d.y));
          const maxY = Math.max(...drillData.drills.map(d => d.y));
          
          const width = maxX - minX;
          const height = maxY - minY;
          
          if (width > 0 && height > 0 && width < 1000 && height < 1000) {
            dimensions = {
              width: Math.round(width * 1000) / 1000,
              height: Math.round(height * 1000) / 1000,
              unit: drillData.unit
            };
          }

          // 分析钻孔尺寸分布，检测HDI特征
          const holeSizes = drillData.drills.map(d => d.size).sort((a, b) => a - b);
          const uniqueSizes = [...new Set(holeSizes)];
          
          // 检测微孔 (直径 < 0.15mm)
          const microViaCount = drillData.drills.filter(d => d.size < 0.15).length;
          if (microViaCount > 0) {
            hdiFeatures.isHDI = true;
            hdiFeatures.microVias = microViaCount;
            result.fabricationNotes!.specialRequirements.push(`Micro-via process required (${microViaCount} holes < 0.15mm)`);
            costFactors.toolingComplexity = 'High';
            costFactors.manufactureTime = 'Extended';
          }

          // 分析孔径密度
          const totalArea = width * height;
          const holeDensity = drillData.drills.length / totalArea;
          if (holeDensity > 1.0) { // 每平方mm超过1个孔
            designComplexity.factors.push('High hole density');
            designComplexity.level = 'Complex';
          }

          // 检测特殊钻孔工艺
          if (uniqueSizes.length > 8) {
            result.fabricationNotes!.warnings.push(`Large number of drill sizes (${uniqueSizes.length}) may increase cost`);
            costFactors.toolingComplexity = 'Medium';
          }

          minHoleSize = Math.min(...drillData.drills.map(d => d.size));
          
          if (minHoleSize < 0.1) {
            result.fabricationNotes!.specialRequirements.push('Precision drilling required for very small holes');
            designComplexity.level = 'Advanced';
          }
          
          result.warnings!.push(...drillData.debugInfo);
        }
      } else {
        // 解析Gerber文件
        const gerberState = parseAdvancedGerberFile(content);
        
        // 计算尺寸
        if (gerberState.bounds.minX !== Infinity && gerberState.bounds.maxX !== -Infinity) {
          const width = gerberState.bounds.maxX - gerberState.bounds.minX;
          const height = gerberState.bounds.maxY - gerberState.bounds.minY;
          
          if (width > 0 && height > 0) {
            let finalWidth = width;
            let finalHeight = height;
            const finalUnit = gerberState.unit;
            
            if (width > 1000 || height > 1000) {
              if (gerberState.unit === 'mm') {
                finalWidth = width / 1000;
                finalHeight = height / 1000;
              } else {
                finalWidth = width / 1000;
                finalHeight = height / 1000;
              }
            }
            
            if (finalWidth < 1 && finalHeight < 1 && gerberState.unit === 'mm') {
              finalWidth = width * 10;
              finalHeight = height * 10;
            }
            
            dimensions = {
              width: Math.round(finalWidth * 1000) / 1000,
              height: Math.round(finalHeight * 1000) / 1000,
              unit: finalUnit
            };

            // 分析板子尺寸以评估工艺复杂度
            const area = finalWidth * finalHeight;
            if (area < 100) { // 小于10cm²
              designComplexity.factors.push('Small form factor');
            } else if (area > 10000) { // 大于100cm²
              designComplexity.factors.push('Large board size');
              costFactors.panelUtilization = Math.max(60, 100 - (area / 1000)); // 大板利用率可能降低
            }

            // 长宽比分析
            const aspectRatio = Math.max(finalWidth, finalHeight) / Math.min(finalWidth, finalHeight);
            if (aspectRatio > 10) {
              designComplexity.factors.push('High aspect ratio');
              result.fabricationNotes!.warnings.push('High aspect ratio may cause warpage issues');
            }
          }
        }

        // 分析光圈以获取更多工艺信息
        let minApertureSize = Infinity;
        let maxApertureSize = 0;
        let apertureCount = 0;
        const traceWidths: number[] = [];
        const padSizes: number[] = [];
        
        for (const [, aperture] of gerberState.apertures) {
          apertureCount++;
          if (aperture.size > 0) {
            minApertureSize = Math.min(minApertureSize, aperture.size);
            maxApertureSize = Math.max(maxApertureSize, aperture.size);
            
            // 根据光圈类型和尺寸分类
            if (aperture.type === 'circle') {
              if (aperture.size < 1.0) {
                traceWidths.push(aperture.size);
              } else {
                padSizes.push(aperture.size);
              }
            }
          }
        }

        if (minApertureSize !== Infinity) {
          minTraceWidth = minApertureSize;
          
          // 基于最小线宽推断工艺等级
          if (minApertureSize < 0.075) { // 3mil
            designComplexity.level = 'Advanced';
            designComplexity.factors.push('Fine pitch traces (< 3mil)');
            result.fabricationNotes!.specialRequirements.push('High-precision etching required');
            costFactors.toolingComplexity = 'High';
          } else if (minApertureSize < 0.1) { // 4mil
            designComplexity.level = 'Complex';
            designComplexity.factors.push('Fine traces (< 4mil)');
            costFactors.toolingComplexity = 'Medium';
          }
        }

        // 分析铜厚 - 基于文件名和线宽推断
        if (fileType && fileType.includes('Copper')) {
          let outerCu = 1.0; // 默认1oz
          let innerCu = 0.5; // 默认0.5oz
          
          // 基于最小线宽推断铜厚
          if (minTraceWidth && minTraceWidth < 0.1) {
            outerCu = 0.5; // 细线通常用薄铜
            result.fabricationNotes!.recommendations.push('Consider 0.5oz copper for fine traces');
          } else if (minTraceWidth && minTraceWidth > 0.5) {
            outerCu = 2.0; // 粗线可能需要厚铜
            result.fabricationNotes!.recommendations.push('Consider 2oz copper for thick traces');
          }
          
          copperThickness = {
            outer: outerCu,
            inner: innerCu,
            unit: 'oz'
          };
        }

        // 检测阻抗控制特征
        let diffPairCount = 0;
        let controlledTraceCount = 0;
        
        // 分析走线模式检测差分对
        const paths = gerberState.paths;
        const parallelTraces: Array<{points: {x: number, y: number}[], distance: number}> = [];
        
        for (let i = 0; i < paths.length - 1; i++) {
          const path1 = paths[i];
          const path2 = paths[i + 1];
          
          if (path1.type === 'line' && path2.type === 'line' && 
              path1.points.length >= 2 && path2.points.length >= 2) {
            
            // 计算两条走线的平均距离
            const dist1 = Math.sqrt(
              Math.pow(path1.points[1].x - path1.points[0].x, 2) + 
              Math.pow(path1.points[1].y - path1.points[0].y, 2)
            );
            const dist2 = Math.sqrt(
              Math.pow(path2.points[1].x - path2.points[0].x, 2) + 
              Math.pow(path2.points[1].y - path2.points[0].y, 2)
            );
            
            // 检查是否平行且距离合适（差分对特征）
            if (Math.abs(dist1 - dist2) < 0.1 && dist1 > 1.0) {
              const separation = Math.sqrt(
                Math.pow(path1.points[0].x - path2.points[0].x, 2) + 
                Math.pow(path1.points[0].y - path2.points[0].y, 2)
              );
              
              if (separation > 0.1 && separation < 0.5) { // 典型差分对间距
                diffPairCount++;
                parallelTraces.push({
                  points: [path1.points[0], path2.points[0]],
                  distance: separation
                });
              }
            }
          }
        }
        
        if (diffPairCount > 0) {
          impedanceControl.hasControlledImpedance = true;
          impedanceControl.differentialPairs = diffPairCount;
          designComplexity.factors.push('Controlled impedance required');
          result.fabricationNotes!.specialRequirements.push(`Impedance control required for ${diffPairCount} differential pairs`);
        }

        // 检测特殊功能
        const contentLower = content.toLowerCase();
        const filenameLower = filename.toLowerCase();
        
        if (contentLower.includes('gold') || contentLower.includes('finger') || 
            filenameLower.includes('gold') || filenameLower.includes('finger') ||
            contentLower.includes('edge') && contentLower.includes('connector')) {
          hasGoldFingers = true;
          result.fabricationNotes!.specialRequirements.push('Gold finger plating required');
          costFactors.toolingComplexity = 'Medium';
        }
        
        // 表面处理检测
        if (filenameLower.includes('enig') || contentLower.includes('enig')) {
          surfaceFinish = { type: 'ENIG', confidence: 'high' };
        } else if (filenameLower.includes('osp') || contentLower.includes('osp')) {
          surfaceFinish = { type: 'OSP', confidence: 'high' };
        } else if (filenameLower.includes('hasl') || contentLower.includes('hasl')) {
          if (contentLower.includes('lead') && contentLower.includes('free')) {
            surfaceFinish = { type: 'Lead-free HASL', confidence: 'medium' };
          } else {
            surfaceFinish = { type: 'HASL', confidence: 'medium' };
          }
        } else if (filenameLower.includes('gold') || contentLower.includes('hard') && contentLower.includes('gold')) {
          surfaceFinish = { type: 'Hard Gold', confidence: 'medium' };
        } else {
          surfaceFinish = { type: 'Unknown', confidence: 'low' };
          result.fabricationNotes!.recommendations.push('Specify surface finish requirements');
        }

        // 检测钢网厚度需求 - 基于paste文件
        if (fileType && fileType.includes('Paste')) {
          let thickness = 0.12; // 默认0.12mm
          
          // 基于最小焊盘尺寸推断钢网厚度
          if (padSizes.length > 0) {
            const minPadSize = Math.min(...padSizes);
            if (minPadSize < 0.3) {
              thickness = 0.08; // 细间距元件用薄钢网
              result.fabricationNotes!.recommendations.push('Consider 0.08mm stencil for fine pitch components');
            } else if (minPadSize > 2.0) {
              thickness = 0.15; // 大元件用厚钢网
              result.fabricationNotes!.recommendations.push('Consider 0.15mm stencil for large components');
            }
          }
          
          stencilThickness = {
            thickness,
            unit: 'mm',
            confidence: 'medium'
          };
        }

        // 过孔分析 - 更详细的HDI检测
        const viaCount = gerberState.viaCount;
        const flashCount = gerberState.paths.filter(p => p.type === 'flash').length;
        
        if (viaCount > 0 || flashCount > 0) {
          hasVias = true;
          
          // 分析过孔密度判断是否为HDI
          if (dimensions) {
            const area = dimensions.width * dimensions.height;
            const viaDensity = (viaCount + flashCount) / area;
            
            if (viaDensity > 2.0) { // 每平方mm超过2个过孔
              hdiFeatures.isHDI = true;
              designComplexity.level = 'Advanced';
              designComplexity.factors.push('High via density (HDI)');
              result.fabricationNotes!.specialRequirements.push('HDI manufacturing process required');
            }
          }
          
          // 检测via-in-pad
          const apertureVias = Array.from(gerberState.apertures.values()).filter(a => a.size < 0.3);
          if (apertureVias.length > 0 && padSizes.length > 0) {
            hdiFeatures.viaInPad = true;
            result.fabricationNotes!.specialRequirements.push('Via-in-pad technology required');
            costFactors.toolingComplexity = 'High';
          }
        }

        drillCount = gerberState.drills.length;
        
        result.warnings!.push(...gerberState.debugInfo);
      }

      // 板厚估算 - 基于层数和工艺要求
      if (result.layers || fileType) {
        let estimatedThickness = 1.6; // 默认1.6mm
        let confidence: 'high' | 'medium' | 'low' = 'low';
        
        // 根据层数估算板厚
        if (result.layers) {
          if (result.layers <= 2) {
            estimatedThickness = 1.6;
            confidence = 'medium';
          } else if (result.layers <= 4) {
            estimatedThickness = 1.6;
            confidence = 'medium';
          } else if (result.layers <= 6) {
            estimatedThickness = 2.0;
            confidence = 'medium';
          } else if (result.layers <= 8) {
            estimatedThickness = 2.4;
            confidence = 'medium';
          } else {
            estimatedThickness = 3.2;
            confidence = 'medium';
          }
        }
        
        // HDI板通常更薄
        if (hdiFeatures.isHDI) {
          estimatedThickness = Math.max(0.8, estimatedThickness * 0.7);
          result.fabricationNotes!.recommendations.push('Consider thinner board for HDI design');
        }
        
        boardThickness = {
          estimated: estimatedThickness,
          unit: 'mm',
          confidence
        };
      }

      // 设计复杂度综合评估
      if (designComplexity.factors.length === 0) {
        designComplexity.level = 'Simple';
      } else if (designComplexity.factors.length <= 2) {
        designComplexity.level = 'Medium';
      } else if (designComplexity.factors.length <= 4) {
        designComplexity.level = 'Complex';
      } else {
        designComplexity.level = 'Advanced';
      }

      // 制造时间评估
      if (hdiFeatures.isHDI || designComplexity.level === 'Advanced') {
        costFactors.manufactureTime = 'Extended';
      } else if (designComplexity.level === 'Complex') {
        costFactors.manufactureTime = 'Extended';
      }

      // 设置分析结果
      result.dimensions = dimensions;
      result.drillCount = drillCount;
      result.hasGoldFingers = hasGoldFingers;
      result.hasVias = hasVias;
      result.minTraceWidth = minTraceWidth;
      result.minHoleSize = minHoleSize;
      result.copperThickness = copperThickness;
      result.boardThickness = boardThickness;
      result.surfaceFinish = surfaceFinish;
      result.stencilThickness = stencilThickness;
      result.impedanceControl = impedanceControl;
      result.hdiFeatures = hdiFeatures;
      result.designComplexity = designComplexity;
      result.costFactors = costFactors;

      // 添加制造建议
      if (result.fabricationNotes!.recommendations.length === 0) {
        result.fabricationNotes!.recommendations.push('Standard PCB manufacturing process suitable');
      }

      // 验证和建议
      if (dimensions) {
        const area = dimensions.width * dimensions.height;
        if (area > 1000000) {
          result.warnings!.push(`Large PCB detected: ${dimensions.width}×${dimensions.height}${dimensions.unit}`);
          result.fabricationNotes!.warnings.push('Large boards may require special handling');
        } else if (area < 1) {
          result.warnings!.push(`Small PCB detected: ${dimensions.width}×${dimensions.height}${dimensions.unit} - please verify dimensions`);
          result.fabricationNotes!.warnings.push('Very small boards may have minimum order quantity requirements');
        }
      }

      if (minTraceWidth && minTraceWidth < 0.05) {
        result.warnings!.push(`Very fine traces detected (${minTraceWidth}mm) - high precision manufacturing required`);
      }

      if (minHoleSize && minHoleSize < 0.1) {
        result.warnings!.push(`Very small holes detected (${minHoleSize}mm) - micro-via process may be required`);
      }

    } catch (error) {
      result.errors!.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }, [detectGerberFileType, parseAdvancedGerberFile, parseDrillFile]);

  // 分析ZIP文件中的Gerber文件
  const analyzeZipFile = useCallback(async (
    file: File, 
    onProgress?: (current: number, total: number, currentFile: string) => void
  ): Promise<GerberAnalysisResult> => {
    const result: GerberAnalysisResult = {
      fileTypes: [],
      errors: [],
      warnings: []
    };

    try {
      onProgress?.(0, 100, 'Extracting ZIP file...');
      
      const zip = await JSZip.loadAsync(file);
      const gerberFiles: { name: string; content: string; type: string }[] = [];
      
      // 提取所有可能的Gerber文件，并分类
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        const entry = zipEntry as JSZipFileEntry;
        if (!entry.dir) {
          const ext = filename.toLowerCase();
          const fileType = detectGerberFileType(filename, '');
          
          // 支持更多文件格式 - 扩展正则表达式
          if (ext.match(/\.(gbr|gtl|gbl|gts|gbs|gto|gbo|gtp|gbp|gko|gm[1-8]|g[1-9]|g[1-2][0-9]|g30|drl|drr|txt|nc|tap|xln|rep|rul|ldp|extrep|tx[1-3]|apr|apr_lib|macro|ger|art|pho)$/)) {
            try {
              const content = await entry.async('text');
              gerberFiles.push({ 
                name: filename, 
                content, 
                type: fileType || 'Unknown'
              });
            } catch (error) {
              result.warnings!.push(`无法读取文件 ${filename}: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
        }
      }

      if (gerberFiles.length === 0) {
        result.errors!.push('ZIP文件中未找到有效的Gerber文件');
        return result;
      }

      // 添加文件统计信息
      result.warnings!.push(`ZIP文件中找到 ${gerberFiles.length} 个Gerber文件`);

      // 分类统计
      const fileTypeStats = new Map<string, number>();
      gerberFiles.forEach(file => {
        const count = fileTypeStats.get(file.type) || 0;
        fileTypeStats.set(file.type, count + 1);
      });

      // 分析每个Gerber文件
      let totalDrillCount = 0;
      let hasGoldFingers = false;
      let hasVias = false;
      let minTraceWidth: number | undefined;
      let minHoleSize: number | undefined;
      let dimensions: GerberAnalysisResult['dimensions'];
      let maxWidth = 0, maxHeight = 0;
      let primaryUnit: 'mm' | 'inch' = 'mm';
      
      // 按文件类型优先级排序，优先处理铜层文件来获取主要尺寸
      const sortedFiles = gerberFiles.sort((a, b) => {
        const priority = (type: string) => {
          if (type.includes('Top Copper')) return 1;
          if (type.includes('Bottom Copper')) return 2;
          if (type.includes('Copper')) return 3;
          if (type.includes('Drill')) return 4;
          return 5;
        };
        return priority(a.type) - priority(b.type);
      });

      // 逐个分析文件，显示进度
      for (let i = 0; i < sortedFiles.length; i++) {
        const gerberFile = sortedFiles[i];
        const progress = Math.round((i / sortedFiles.length) * 80) + 10; // 10-90%
        
        onProgress?.(progress, 100, `Analyzing ${gerberFile.name}...`);
        
        const analysis = await analyzeGerberContent(gerberFile.content, gerberFile.name);
        
        if (analysis.fileTypes) {
          result.fileTypes!.push(...analysis.fileTypes);
        }
        
        if (analysis.drillCount) {
          totalDrillCount += analysis.drillCount;
        }
        
        if (analysis.hasGoldFingers) {
          hasGoldFingers = true;
        }
        
        if (analysis.hasVias) {
          hasVias = true;
        }
        
        if (analysis.minTraceWidth && (!minTraceWidth || analysis.minTraceWidth < minTraceWidth)) {
          minTraceWidth = analysis.minTraceWidth;
        }
        
        if (analysis.minHoleSize && (!minHoleSize || analysis.minHoleSize < minHoleSize)) {
          minHoleSize = analysis.minHoleSize;
        }
        
        // 改进尺寸计算 - 取最大尺寸作为PCB尺寸
        if (analysis.dimensions) {
          const currentWidth = analysis.dimensions.width;
          const currentHeight = analysis.dimensions.height;
          
          if (currentWidth > maxWidth || currentHeight > maxHeight) {
            maxWidth = Math.max(maxWidth, currentWidth);
            maxHeight = Math.max(maxHeight, currentHeight);
            primaryUnit = analysis.dimensions.unit;
            
            dimensions = {
              width: maxWidth,
              height: maxHeight,
              unit: primaryUnit
            };
          }
        }
        
        if (analysis.errors) {
          result.errors!.push(...analysis.errors);
        }
        
        if (analysis.warnings) {
          result.warnings!.push(...analysis.warnings);
        }
      }

      onProgress?.(90, 100, 'Calculating results...');

      // 改进的层数计算逻辑 - 完全重写
      let estimatedLayers = 2; // 默认双层板
      const layerInfo = {
        topCopper: false,
        bottomCopper: false,
        innerLayers: 0,
        actualInnerLayers: [] as string[],
        totalCopperLayers: 0
      };
      
      // 分析所有文件类型，准确识别铜层
      for (const fileType of result.fileTypes!) {
        const lowerType = fileType.toLowerCase();
        
        // 识别顶层铜
        if (lowerType.includes('top copper') || 
            lowerType === 'top' ||
            fileType.match(/\.gtl$/i) ||
            fileType.includes('L1') ||
            fileType.includes('Layer 1')) {
          layerInfo.topCopper = true;
          layerInfo.totalCopperLayers++;
        }
        
        // 识别底层铜
        else if (lowerType.includes('bottom copper') || 
                 lowerType === 'bottom' ||
                 fileType.match(/\.gbl$/i) ||
                 fileType.includes('L2') ||
                 fileType.includes('Layer 2')) {
          layerInfo.bottomCopper = true;
          layerInfo.totalCopperLayers++;
        }
        
        // 识别内层铜 - 支持多种命名规则
        else if (lowerType.includes('inner copper') ||
                 lowerType.includes('inner layer') ||
                 fileType.match(/^inner/i) ||
                 fileType.match(/\.g\d+$/i) ||  // .g1, .g2, etc.
                 fileType.match(/^g\d+/i) ||    // G1, G2, etc.
                 fileType.match(/layer [3-9]/i) ||
                 fileType.match(/layer [1-2][0-9]/i) ||
                 fileType.match(/layer 3[0-2]/i) ||
                 fileType.match(/L[3-9]$/i) ||
                 fileType.match(/L[1-2][0-9]$/i) ||
                 fileType.match(/L3[0-2]$/i) ||
                 fileType.match(/signal[1-9]/i) ||
                 fileType.match(/plane[1-9]/i) ||
                 fileType.match(/power[1-9]/i) ||
                 fileType.match(/ground[1-9]/i) ||
                 fileType.includes('Inner Copper Layer')) { // 新增：识别 "Inner Copper Layer G4" 格式
          
          layerInfo.innerLayers++;
          layerInfo.actualInnerLayers.push(fileType);
          layerInfo.totalCopperLayers++;
        }
        
        // 其他可能的铜层标识
        else if (fileType.includes('Copper') && !fileType.includes('Mask')) {
          layerInfo.totalCopperLayers++;
        }
      }
      
      // 基于检测到的层数计算PCB层数
      if (layerInfo.topCopper && layerInfo.bottomCopper) {
        // 有顶层和底层
        if (layerInfo.innerLayers === 0) {
          estimatedLayers = 2; // 双层板
        } else {
          // 总层数 = 顶层 + 底层 + 内层
          estimatedLayers = 2 + layerInfo.innerLayers;
        }
      } else if (layerInfo.totalCopperLayers > 0) {
        // 没有明确的顶层/底层标识，基于总铜层数推断
        estimatedLayers = layerInfo.totalCopperLayers;
      }
      
      // 确保层数符合PCB标准 (偶数层，除了单层板)
      if (estimatedLayers > 2 && estimatedLayers % 2 !== 0) {
        estimatedLayers = estimatedLayers + 1; // 向上取偶数
      }
      
      // 限制在合理范围内
      const standardLayers = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
      if (!standardLayers.includes(estimatedLayers)) {
        // 找到最接近的标准层数
        estimatedLayers = standardLayers.reduce((prev, curr) => 
          Math.abs(curr - estimatedLayers) < Math.abs(prev - estimatedLayers) ? curr : prev
        );
      }
      
      // 验证逻辑：检查阻焊层和丝印层
      const maskLayers = result.fileTypes!.filter(type => 
        type.includes('Solder Mask') || type.includes('Mask')
      ).length;
      
      const silkLayers = result.fileTypes!.filter(type => 
        type.includes('Silk Screen') || type.includes('Silkscreen') || type.includes('Legend')
      ).length;
      
      // 如果有双面阻焊或丝印，至少是双层板
      if ((maskLayers >= 2 || silkLayers >= 2) && estimatedLayers < 2) {
        estimatedLayers = 2;
      }

      result.layers = estimatedLayers;
      result.drillCount = totalDrillCount;
      result.hasGoldFingers = hasGoldFingers;
      result.hasVias = hasVias;
      result.minTraceWidth = minTraceWidth;
      result.minHoleSize = minHoleSize;
      result.dimensions = dimensions;

      // 去重文件类型
      const uniqueFileTypes = Array.from(new Set(result.fileTypes!));
      result.fileTypes = uniqueFileTypes;

      // 生成详细的层数分析报告
      const layerAnalysisReport = [
        `PCB Layer Analysis:`,
        `- Top Copper: ${layerInfo.topCopper ? 'Yes' : 'No'}`,
        `- Bottom Copper: ${layerInfo.bottomCopper ? 'Yes' : 'No'}`,
        `- Inner Layers: ${layerInfo.innerLayers}`,
        `- Total Copper Layers: ${layerInfo.totalCopperLayers}`,
        `- Estimated PCB Layers: ${estimatedLayers}`,
        `- Solder Mask Layers: ${maskLayers}`,
        `- Silk Screen Layers: ${silkLayers}`
      ];
      
      if (layerInfo.actualInnerLayers.length > 0) {
        layerAnalysisReport.push(`- Detected Inner Layers: ${layerInfo.actualInnerLayers.join(', ')}`);
      }
      
      // 添加特殊文件类型统计
      const drillFiles = result.fileTypes!.filter(type => 
        type.includes('Drill') || type.includes('NC Drill')
      ).length;
      
      const mechanicalFiles = result.fileTypes!.filter(type => 
        type.includes('Mechanical') || type.includes('Keep Out') || type.includes('Outline')
      ).length;
      
      if (drillFiles > 0) {
        layerAnalysisReport.push(`- Drill Files: ${drillFiles}`);
      }
      
      if (mechanicalFiles > 0) {
        layerAnalysisReport.push(`- Mechanical/Outline Files: ${mechanicalFiles}`);
      }
      
      if (totalDrillCount > 0) {
        layerAnalysisReport.push(`- Total Drill Holes: ${totalDrillCount}`);
      }
      
      result.warnings!.push(...layerAnalysisReport);

      onProgress?.(100, 100, 'Analysis complete');

    } catch (error) {
      result.errors!.push(`ZIP文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }, [analyzeGerberContent, detectGerberFileType]);

  // 分析RAR文件中的Gerber文件 - 使用libarchive.js重新实现
  const analyzeRarFile = useCallback(async (
    file: File, 
    onProgress?: (current: number, total: number, currentFile: string) => void
  ): Promise<GerberAnalysisResult> => {
    const result: GerberAnalysisResult = {
      fileTypes: [],
      errors: [],
      warnings: []
    };

    try {
      onProgress?.(0, 100, 'Initializing RAR library...');
      
      // Initialize RAR library
      const archiveLib = await initLibArchive();
      if (!archiveLib) {
        throw new Error('Failed to load RAR library. RAR files are not supported in this environment.');
      }

      onProgress?.(10, 100, 'Extracting RAR file...');
      
      // Open the RAR file
      const archive = await archiveLib.open(file);
      
      onProgress?.(30, 100, 'Reading file list...');
      
      // Get all files from the archive
      const allFiles = await archive.getFilesArray();
      
      result.warnings!.push(`RAR archive contains ${allFiles.length} files`);
      
      // Debug: output the actual structure of allFiles (safe way to avoid circular references)
      if (allFiles.length > 0) {
        const firstFile = allFiles[0];
        const fileProps = Object.keys(firstFile).filter((key: string) => typeof (firstFile as any)[key] !== 'object' || (firstFile as any)[key] === null);
        result.warnings!.push(`First file properties: ${fileProps.join(', ')}`);
        result.warnings!.push(`First file path-related properties: path=${(firstFile as any).path}, name=${(firstFile as any).name}, fileName=${(firstFile as any).fileName}`);
      }
      
      // Add detailed file listing for debugging
      const fileList = allFiles.map((entry: RarArchiveEntry) => {
        // Try different possible property names - be more comprehensive
        const path = entry.path || entry.file?.name || entry.name || entry.fileName || 'unknown_path';
        
        // Debug: Log all available properties for the first few entries
        if (allFiles.indexOf(entry) < 3) {
          const allProps = Object.keys(entry);
          result.warnings!.push(`Entry ${allFiles.indexOf(entry)} properties: ${allProps.join(', ')}`);
          
          // Also check if there are any string properties that might be the filename
          for (const prop of allProps) {
            const value = (entry as any)[prop];
            if (typeof value === 'string' && value.length > 0) {
              result.warnings!.push(`String property ${prop}: "${value}"`);
            }
          }
        }
        
        // Try to get filename from any string property that looks like a filename
        let actualFileName = path;
        if (!actualFileName || actualFileName === 'unknown_path') {
          // Search through all properties for something that looks like a filename
          const allProps = Object.keys(entry);
          for (const prop of allProps) {
            const value = (entry as any)[prop];
            if (typeof value === 'string' && value.includes('.') && value.length > 3) {
              actualFileName = value;
              break;
            }
          }
        }
        
        // Use detectGerberFileType if we have a filename
        const detectedType = actualFileName && actualFileName !== 'unknown_path' 
          ? detectGerberFileType(actualFileName, '') 
          : 'unknown_type';
        
        return `${actualFileName} (${detectedType})`;
      }).join(', ');
      result.warnings!.push(`Files in RAR: ${fileList}`);

      // Filter out Gerber files
      const gerberFiles: Array<{ entry: RarArchiveEntry; content: string; type: string }> = [];
      
      onProgress?.(40, 100, 'Filtering Gerber files...');
      
      for (const entry of allFiles) {
        // Try to get the file path from different possible properties - more comprehensive approach
        let filePath = entry.path || entry.file?.name || entry.name || entry.fileName;
        
        // If no filename found using standard properties, search through all properties
        if (!filePath) {
          const allProps = Object.keys(entry);
          for (const prop of allProps) {
            const value = (entry as any)[prop];
            if (typeof value === 'string' && value.includes('.') && value.length > 3) {
              filePath = value;
              break;
            }
          }
        }
        
        if (filePath && !entry.type?.includes('directory')) {
          const fileType = detectGerberFileType(filePath, '');
          
          // Check if it's a Gerber related file
          const fileName = filePath.toLowerCase();
          const isGerberFile = fileName.match(/\.(gbr|gtl|gbl|gts|gbs|gto|gbo|gtp|gbp|gko|gm[1-8]|g[1-9]|g[1-2][0-9]|g30|drl|drr|txt|nc|tap|xln|rep|rul|ldp|extrep|tx[1-3]|apr|apr_lib|macro|ger|art|pho)$/);
          
          // Additional checks for files without extensions but with Gerber-like content
          const hasGerberKeywords = fileName.includes('gerber') || 
                                   fileName.includes('copper') || 
                                   fileName.includes('drill') || 
                                   fileName.includes('mask') || 
                                   fileName.includes('silk') || 
                                   fileName.includes('paste') ||
                                   fileName.includes('top') || 
                                   fileName.includes('bottom') ||
                                   fileName.includes('inner') ||
                                   fileName.includes('outline');
          
          // Debug: log file processing
          result.warnings!.push(`Processing file: ${filePath}, detected type: ${fileType || 'none'}, matches pattern: ${!!isGerberFile}, has keywords: ${hasGerberKeywords}`);
          
          if (isGerberFile || fileType !== 'unknown_type' || hasGerberKeywords) {
            try {
              // Extract single file - try using the actual file path
              const extractedFile = await archive.extractSingleFile(filePath);
              const content = await extractedFile.text();
              
              gerberFiles.push({
                entry: { ...entry, path: filePath }, // Normalize the entry object
                content,
                type: fileType || 'Unknown'
              });
              
              result.warnings!.push(`Successfully extracted: ${filePath}`);
            } catch (error) {
              result.warnings!.push(`Failed to extract file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Close the archive to free memory
      await archive.close();

      if (gerberFiles.length === 0) {
        result.errors!.push('No valid Gerber files found in RAR archive');
        return result;
      }

      result.warnings!.push(`Found ${gerberFiles.length} Gerber files in RAR archive`);

      // 分析每个Gerber文件 - 与ZIP文件分析逻辑类似
      let totalDrillCount = 0;
      let hasGoldFingers = false;
      let hasVias = false;
      let minTraceWidth: number | undefined;
      let minHoleSize: number | undefined;
      let dimensions: GerberAnalysisResult['dimensions'];
      let maxWidth = 0, maxHeight = 0;
      let primaryUnit: 'mm' | 'inch' = 'mm';
      
      // 按文件类型优先级排序
      const sortedFiles = gerberFiles.sort((a, b) => {
        const priority = (type: string) => {
          if (type.includes('Top Copper')) return 1;
          if (type.includes('Bottom Copper')) return 2;
          if (type.includes('Copper')) return 3;
          if (type.includes('Drill')) return 4;
          return 5;
        };
        return priority(a.type) - priority(b.type);
      });

      // 逐个分析文件
      for (let i = 0; i < sortedFiles.length; i++) {
        const gerberFile = sortedFiles[i];
        const progress = Math.round((i / sortedFiles.length) * 40) + 50; // 50-90%
        
        onProgress?.(progress, 100, `Analyzing ${gerberFile.entry.path || 'unknown file'}...`);
        
        const filePath = gerberFile.entry.path || 'unknown';
        const fileAnalysis = await analyzeGerberContent(gerberFile.content, filePath);
        
        if (fileAnalysis.fileTypes) {
          result.fileTypes!.push(...fileAnalysis.fileTypes);
        }
        
        if (fileAnalysis.drillCount) {
          totalDrillCount += fileAnalysis.drillCount;
        }
        
        if (fileAnalysis.hasGoldFingers) {
          hasGoldFingers = true;
        }
        
        if (fileAnalysis.hasVias) {
          hasVias = true;
        }
        
        if (fileAnalysis.minTraceWidth && (!minTraceWidth || fileAnalysis.minTraceWidth < minTraceWidth)) {
          minTraceWidth = fileAnalysis.minTraceWidth;
        }
        
        if (fileAnalysis.minHoleSize && (!minHoleSize || fileAnalysis.minHoleSize < minHoleSize)) {
          minHoleSize = fileAnalysis.minHoleSize;
        }
        
        // 尺寸计算
        if (fileAnalysis.dimensions) {
          const currentWidth = fileAnalysis.dimensions.width;
          const currentHeight = fileAnalysis.dimensions.height;
          
          if (currentWidth > maxWidth || currentHeight > maxHeight) {
            maxWidth = Math.max(maxWidth, currentWidth);
            maxHeight = Math.max(maxHeight, currentHeight);
            primaryUnit = fileAnalysis.dimensions.unit;
            
            dimensions = {
              width: maxWidth,
              height: maxHeight,
              unit: primaryUnit
            };
          }
        }
        
        if (fileAnalysis.errors) {
          result.errors!.push(...fileAnalysis.errors);
        }
        
        if (fileAnalysis.warnings) {
          result.warnings!.push(...fileAnalysis.warnings);
        }
      }

      onProgress?.(90, 100, 'Calculating results...');

      // 层数计算逻辑（与ZIP文件相同）
      let estimatedLayers = 2;
      
      const copperLayers = result.fileTypes!.filter(type => 
        type.includes('Copper') || 
        type.includes('Top') && !type.includes('Mask') && !type.includes('Silkscreen') && !type.includes('Paste') ||
        type.includes('Bottom') && !type.includes('Mask') && !type.includes('Silkscreen') && !type.includes('Paste') ||
        type.includes('Inner')
      ).length;
      
      const innerLayers = result.fileTypes!.filter(type => 
        type.includes('Inner Copper') || 
        type.match(/Layer [0-9]+/) ||
        type.match(/^G[1-9]/) ||
        type.match(/^G[1-2][0-9]/) ||
        type.match(/^G30/)
      ).length;
      
      // 层数推断逻辑（与ZIP文件相同）
      if (innerLayers >= 28) {
        estimatedLayers = 32;
      } else if (innerLayers >= 18) {
        estimatedLayers = 20;
      } else if (innerLayers >= 14) {
        estimatedLayers = 16;
      } else if (innerLayers >= 10) {
        estimatedLayers = 12;
      } else if (innerLayers >= 8) {
        estimatedLayers = 10;
      } else if (innerLayers >= 6) {
        estimatedLayers = 8;
      } else if (innerLayers >= 4) {
        estimatedLayers = 6;
      } else if (innerLayers >= 2) {
        estimatedLayers = 4;
      } else if (copperLayers >= 4) {
        estimatedLayers = 4;
      } else if (copperLayers >= 3) {
        estimatedLayers = 4;
      } else if (copperLayers >= 2) {
        estimatedLayers = 2;
      }

      result.layers = estimatedLayers;
      result.drillCount = totalDrillCount;
      result.hasGoldFingers = hasGoldFingers;
      result.hasVias = hasVias;
      result.minTraceWidth = minTraceWidth;
      result.minHoleSize = minHoleSize;
      result.dimensions = dimensions;

      // 去重文件类型
      const uniqueFileTypes = Array.from(new Set(result.fileTypes!));
      result.fileTypes = uniqueFileTypes;

      // 添加分析报告
      const analysisReport = [
        `RAR archive processed successfully`,
        `Found ${copperLayers} copper layer files (${innerLayers} inner layers)`,
        `Estimated PCB layers: ${estimatedLayers}`
      ];
      
      if (totalDrillCount > 0) {
        analysisReport.push(`Total drill holes: ${totalDrillCount}`);
      }
      
      result.warnings!.push(...analysisReport);

      onProgress?.(100, 100, 'RAR analysis complete');

    } catch (error) {
      result.errors!.push(`RAR file analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }, [analyzeGerberContent, detectGerberFileType]);

  // 分析单个文件
  const analyzeSingleFile = useCallback(async (file: File, onProgress?: (current: number, total: number, currentFile: string) => void): Promise<GerberAnalysisResult> => {
    const result: GerberAnalysisResult = {
      dimensions: undefined,
      layers: 1,
      drillCount: 0,
      hasGoldFingers: false,
      hasVias: false,
      minTraceWidth: undefined,
      minHoleSize: undefined,
      fileTypes: [],
      errors: [],
      warnings: []
    };

    try {
      onProgress?.(10, 100, file.name);
      
      const content = await file.text();
      onProgress?.(30, 100, file.name);
      
      const state = parseAdvancedGerberFile(content);
      onProgress?.(70, 100, file.name);
      
      // 根据文件名推断文件类型
      const fileNameLower = file.name.toLowerCase();
      const fileTypes = result.fileTypes || [];
      
      // 使用改进的文件类型检测
      const detectedType = detectGerberFileType(file.name, content);
      if (detectedType) {
        fileTypes.push(detectedType);
      } else {
        // 如果无法检测，尝试基于文件名关键词
        if (fileNameLower.includes('.gtl') || fileNameLower.includes('top') || fileNameLower.includes('copper')) {
          fileTypes.push('Top Copper');
        } else if (fileNameLower.includes('.gbl') || fileNameLower.includes('bottom')) {
          fileTypes.push('Bottom Copper');
        } else if (fileNameLower.includes('.gts') || fileNameLower.includes('soldermask')) {
          fileTypes.push('Top Solder Mask');
        } else if (fileNameLower.includes('.gto') || fileNameLower.includes('silkscreen')) {
          fileTypes.push('Top Silkscreen');
        } else if (fileNameLower.includes('.drl') || fileNameLower.includes('drill')) {
          fileTypes.push('Drill File');
        } else {
          fileTypes.push('Unknown');
        }
      }
      
      result.fileTypes = fileTypes;

      // 更新分析结果
      result.drillCount = state.drills.length;
      
      // 计算正确的尺寸
      if (state.bounds.minX !== Infinity && state.bounds.maxX !== -Infinity) {
        result.dimensions = {
          width: Math.round((state.bounds.maxX - state.bounds.minX) * 100) / 100,
          height: Math.round((state.bounds.maxY - state.bounds.minY) * 100) / 100,
          unit: state.unit
        };
      }
      
      onProgress?.(90, 100, file.name);
      
      // 添加分析报告到warnings中
      const warnings = result.warnings || [];
      const reportLines = [
        `Single file analysis completed:`,
        `- File type: ${fileTypes.join(', ')}`,
        `- Drill holes: ${result.drillCount}`,
      ];
      
      if (result.dimensions) {
        reportLines.push(`- Dimensions: ${result.dimensions.width.toFixed(2)}mm × ${result.dimensions.height.toFixed(2)}mm`);
      }
      
      warnings.push(...reportLines);
      result.warnings = warnings;

    } catch (error) {
      const errors = result.errors || [];
      errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errors = errors;
    }

    onProgress?.(100, 100, file.name);
    return result;
  }, [parseAdvancedGerberFile, detectGerberFileType]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // 检查文件格式支持
      const fileName = file.name.toLowerCase();
      const isUnsupportedArchive = fileName.endsWith('.7z') || fileName.endsWith('.tar') || fileName.endsWith('.gz');
      
      if (isUnsupportedArchive) {
        setUploadState(prev => ({
          ...prev,
          file,
          fileName: file.name,
          fileSize: file.size,
          uploadStatus: 'error',
          uploadError: 'This archive format is not supported yet. Please use ZIP or RAR format, or extract the files and upload individual Gerber files.',
          uploadProgress: 0,
          uploadUrl: null,
        }));
        return;
      }

      setUploadState(prev => ({
        ...prev,
        file,
        fileName: file.name,
        fileSize: file.size,
        uploadStatus: 'uploading',
        uploadProgress: 0,
        uploadError: null,
        analysisResult: null,
        isAnalyzing: false,
        thumbnail: null,
        isGeneratingThumbnail: false,
        analysisProgress: undefined,
      }));

      // 上传文件
      const uploadResult = await uploadFileToServer(file, (progress) => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: progress
        }));
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // 更新表单数据
      updateFormData({ gerberUrl: uploadResult.url || '' });

      // 开始分析
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'success',
        uploadUrl: uploadResult.url || null,
        isAnalyzing: true,
        analysisProgress: {
          current: 0,
          total: 100,
          currentFile: file.name,
        },
      }));

      // 分析文件
      let analysisResult: GerberAnalysisResult | null = null;
      
      if (fileName.endsWith('.zip')) {
        analysisResult = await analyzeZipFile(file, (current, total, currentFile) => {
          setUploadState(prev => ({
            ...prev,
            analysisProgress: {
              current,
              total,
              currentFile,
            },
          }));
        });
      } else if (fileName.endsWith('.rar')) {
        analysisResult = await analyzeRarFile(file, (current, total, currentFile) => {
          setUploadState(prev => ({
            ...prev,
            analysisProgress: {
              current,
              total,
              currentFile,
            },
          }));
        });
      } else {
        // 检查是否为有效的Gerber文件格式
        const isValidGerberFile = fileName.match(/\.(gbr|gtl|gbl|gts|gbs|gto|gbo|gtp|gbp|gko|gm[1-8]|g[1-9]|g[1-2][0-9]|g30|drl|drr|txt|nc|tap|xln|rep|rul|ldp|extrep|tx[1-3]|apr|apr_lib|macro|ger|art|pho)$/);
        
        if (!isValidGerberFile) {
          throw new Error('Unsupported file format. Please upload ZIP archives or individual Gerber files (.gbr, .gtl, .gbl, .drl, etc.)');
        }

        setUploadState(prev => ({
          ...prev,
          analysisProgress: {
            current: 50,
            total: 100,
            currentFile: file.name,
          },
        }));
        
        analysisResult = await analyzeSingleFile(file, (current, total, currentFile) => {
          setUploadState(prev => ({
            ...prev,
            analysisProgress: {
              current,
              total,
              currentFile,
            },
          }));
        });
        
        setUploadState(prev => ({
          ...prev,
          analysisProgress: {
            current: 100,
            total: 100,
            currentFile: file.name,
          },
        }));
      }

      setUploadState(prev => ({
        ...prev,
        analysisResult,
        isAnalyzing: false,
        analysisProgress: {
          current: 100,
          total: 100,
          currentFile: file.name,
        },
      }));

    } catch (error) {
      console.error('File upload error:', error);
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadError: error instanceof Error ? error.message : 'Upload failed',
        uploadProgress: 0,
        analysisProgress: undefined,
      }));
    }
  }, [updateFormData, analyzeZipFile, analyzeRarFile, analyzeSingleFile]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 清空input值，允许重新选择同一文件
    event.target.value = '';
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setUploadState(createInitialState());
    // 清除表单中的URL
    updateFormData({ gerberUrl: '' });
  }, [updateFormData]);

  const retryUpload = useCallback(() => {
    if (uploadState.file) {
      handleFileSelect(uploadState.file);
    }
  }, [uploadState.file, handleFileSelect]);

  const { uploadStatus, uploadProgress, uploadError, fileName, fileSize, analysisResult, isAnalyzing, thumbnail, isGeneratingThumbnail, analysisProgress } = uploadState;
  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';
  const isError = uploadStatus === 'error';
  const hasFile = uploadStatus !== 'idle';

  return (
    <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
            <Upload className="h-4 w-4" />
          </div>
          Gerber File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* 文件选择区域 */}
        {!hasFile && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Upload your Gerber files</p>
              <p className="text-xs text-gray-500">
                Supported formats: .zip, .rar, .gerber, .gbr, .gtl, .gbl, .drl, .nc, .txt
              </p>
              <p className="text-xs text-gray-500">Maximum file size: 50MB</p>
            </div>
            <input
              type="file"
              accept=".zip,.rar,.gerber,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.gtp,.gbp,.gko,.drl,.drr,.txt,.nc,.tap,.xln,.ger,.art,.pho"
              onChange={handleFileInputChange}
              className="hidden"
              id="gerber-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById('gerber-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}

        {/* 文件信息和状态 */}
        {hasFile && (
          <div className="space-y-4">
            {/* 文件信息 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <File className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
                {isError && <X className="h-5 w-5 text-red-600" />}
                {isUploading && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* 上传进度 */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 分析进度 */}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Analyzing Gerber file...
              </div>
            )}

            {/* 成功状态 */}
            {isSuccess && !isAnalyzing && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload successful!</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  File URL has been automatically added to the form.
                </p>
              </div>
            )}

            {/* 错误状态 */}
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload failed</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{uploadError}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {isError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryUpload}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="text-gray-600 hover:text-gray-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <input
                type="file"
                accept=".zip,.rar,.gerber,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.gtp,.gbp,.gko,.drl,.drr,.txt,.nc,.tap,.xln,.ger,.art,.pho"
                onChange={handleFileInputChange}
                className="hidden"
                id="gerber-upload-replace"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('gerber-upload-replace')?.click()}
                className="text-blue-600 hover:text-blue-700"
              >
                <Upload className="h-4 w-4 mr-1" />
                Replace
              </Button>
            </div>
          </div>
        )}

        {/* Gerber 分析结果展示 - 紧凑版 */}
        {analysisResult && !isAnalyzing && (
          <div className="mt-4">
            {/* 错误信息 */}
            {analysisResult.errors && analysisResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Errors</span>
                </div>
                <ul className="space-y-1">
                  {analysisResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 成功提示 */}
            {(!analysisResult.errors || analysisResult.errors.length === 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Gerber files analyzed successfully! Key specifications have been detected.
                  </span>
                </div>
              </div>
            )}

            {/* 综合分析结果 - 紧凑版 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-800">PCB Analysis Summary</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {/* 尺寸信息 */}
                {analysisResult.dimensions && (
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xs text-blue-600 font-medium">Dimensions</div>
                    <div className="font-semibold text-gray-900">
                      {analysisResult.dimensions.width} × {analysisResult.dimensions.height} {analysisResult.dimensions.unit}
                    </div>
                  </div>
                )}
                
                {/* 层数 */}
                {analysisResult.layers && (
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-green-600 font-medium">Layers</div>
                    <div className="font-semibold text-gray-900">{analysisResult.layers}</div>
                  </div>
                )}
                
                {/* 最小线宽 */}
                {analysisResult.minTraceWidth && (
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-xs text-purple-600 font-medium">Min Trace</div>
                    <div className="font-semibold text-gray-900">{analysisResult.minTraceWidth}mm</div>
                  </div>
                )}
                
                {/* 最小孔径 */}
                {analysisResult.minHoleSize && (
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xs text-orange-600 font-medium">Min Hole</div>
                    <div className="font-semibold text-gray-900">{analysisResult.minHoleSize}mm</div>
                  </div>
                )}
                
                {/* 钻孔数量 */}
                {analysisResult.drillCount && (
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="text-xs text-indigo-600 font-medium">Drill Count</div>
                    <div className="font-semibold text-gray-900">{analysisResult.drillCount}</div>
                  </div>
                )}
                
                {/* 铜厚 */}
                {analysisResult.copperThickness && (
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="text-xs text-yellow-600 font-medium">Copper Weight</div>
                    <div className="font-semibold text-gray-900 text-xs">
                      {analysisResult.copperThickness.outer}{analysisResult.copperThickness.unit}
                    </div>
                  </div>
                )}
                
                {/* 板厚 */}
                {analysisResult.boardThickness && (
                  <div className="bg-teal-50 p-2 rounded">
                    <div className="text-xs text-teal-600 font-medium">Thickness</div>
                    <div className="font-semibold text-gray-900">
                      {analysisResult.boardThickness.estimated}{analysisResult.boardThickness.unit}
                    </div>
                  </div>
                )}
                
                {/* 表面处理 */}
                {analysisResult.surfaceFinish && (
                  <div className="bg-pink-50 p-2 rounded">
                    <div className="text-xs text-pink-600 font-medium">Surface Finish</div>
                    <div className="font-semibold text-gray-900 text-xs">{analysisResult.surfaceFinish.type}</div>
                  </div>
                )}
              </div>
              
              {/* 特殊功能 - 紧凑显示 */}
              {(analysisResult.hasGoldFingers || analysisResult.hasVias || 
                (analysisResult.solderMask && (analysisResult.solderMask.hasTopMask || analysisResult.solderMask.hasBottomMask)) ||
                (analysisResult.silkScreen && (analysisResult.silkScreen.hasTopSilk || analysisResult.silkScreen.hasBottomSilk))) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Features:</div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.hasGoldFingers && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Gold Fingers</span>
                    )}
                    {analysisResult.hasVias && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Vias</span>
                    )}
                    {analysisResult.solderMask && (analysisResult.solderMask.hasTopMask || analysisResult.solderMask.hasBottomMask) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Solder Mask ({analysisResult.solderMask.color})
                      </span>
                    )}
                    {analysisResult.silkScreen && (analysisResult.silkScreen.hasTopSilk || analysisResult.silkScreen.hasBottomSilk) && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Silkscreen ({analysisResult.silkScreen.color})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 当前URL显示 - 只在客户端渲染后显示 */}
        {isClient && formData.gerberUrl && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-blue-800">Current Gerber URL:</p>
              <button
                onClick={() => updateFormData({ gerberUrl: '' })}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                title="Clear saved URL"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-blue-600 break-all font-mono">{formData.gerberUrl}</p>
          </div>
        )}

        {/* 分析进度展示 */}
        {/*
        {analysisProgress && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Analyzing {analysisProgress.currentFile}...
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress:</span>
              <span>{analysisProgress.current}%</span>
            </div>
          </div>
        )}
        */}
      </CardContent>
    </Card>
  );
} 