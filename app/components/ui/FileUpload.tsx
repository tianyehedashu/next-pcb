import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { mapGerberAnalysisToForm } from '@/lib/utils/gerberAnalysisHelper';
import { PcbQuoteForm } from '@/types/pcbQuoteForm';
import { 
  FileText, 
  Layers, 
  Ruler, 
  Zap, 
  Circle, 
  AlertTriangle, 
  CheckCircle, 
  FileCheck
} from 'lucide-react';

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
}

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onGerberAnalysis?: (result: GerberAnalysisResult) => void;
  onFormUpdate?: (updates: Partial<PcbQuoteForm>) => void;
  accept?: string;
  className?: string;
  value?: File | null;
}

export function FileUpload({
  onFileChange,
  onGerberAnalysis,
  onFormUpdate,
  accept = ".zip,.rar,.7z,.tar,.gz,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.drl,.txt",
  className,
  value,
}: FileUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GerberAnalysisResult | null>(null);

  // 分析Gerber文件内容
  const analyzeGerberContent = useCallback(async (content: string, filename: string): Promise<Partial<GerberAnalysisResult>> => {
    const result: Partial<GerberAnalysisResult> = {
      fileTypes: [],
      errors: [],
      warnings: []
    };

    try {
      // 检测文件类型
      const fileType = detectGerberFileType(filename);
      if (fileType) {
        result.fileTypes!.push(fileType);
      }

      // 解析基本信息
      const lines = content.split('\n');
      let unit: 'mm' | 'inch' = 'mm';
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let drillCount = 0;
      let hasGoldFingers = false;
      let hasVias = false;
      let minTraceWidth: number | undefined;
      let minHoleSize: number | undefined;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 检测单位
        if (trimmedLine.includes('%MOIN*%')) {
          unit = 'inch';
        } else if (trimmedLine.includes('%MOMM*%')) {
          unit = 'mm';
        }

        // 检测坐标范围
        const coordMatch = trimmedLine.match(/X(-?\d+)Y(-?\d+)/);
        if (coordMatch) {
          const x = parseInt(coordMatch[1]);
          const y = parseInt(coordMatch[2]);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        // 检测钻孔
        if (trimmedLine.match(/^T\d+C/) || trimmedLine.includes('DRILL')) {
          drillCount++;
        }

        // 检测金手指
        if (trimmedLine.includes('GOLD') || trimmedLine.includes('FINGER')) {
          hasGoldFingers = true;
        }

        // 检测过孔
        if (trimmedLine.includes('VIA') || trimmedLine.match(/D\d+\*/)) {
          hasVias = true;
        }

        // 检测最小线宽
        const traceMatch = trimmedLine.match(/%ADD\d+C,(\d*\.?\d+)/);
        if (traceMatch) {
          const width = parseFloat(traceMatch[1]);
          if (!minTraceWidth || width < minTraceWidth) {
            minTraceWidth = width;
          }
        }

        // 检测最小孔径
        const holeMatch = trimmedLine.match(/T\d+C(\d*\.?\d+)/);
        if (holeMatch) {
          const size = parseFloat(holeMatch[1]);
          if (!minHoleSize || size < minHoleSize) {
            minHoleSize = size;
          }
        }
      }

      // 计算尺寸
      if (minX !== Infinity && maxX !== -Infinity) {
        const width = (maxX - minX) / (unit === 'inch' ? 100000 : 1000); // 转换为实际单位
        const height = (maxY - minY) / (unit === 'inch' ? 100000 : 1000);
        
        result.dimensions = {
          width: Math.round(width * 100) / 100,
          height: Math.round(height * 100) / 100,
          unit
        };
      }

      result.drillCount = drillCount;
      result.hasGoldFingers = hasGoldFingers;
      result.hasVias = hasVias;
      result.minTraceWidth = minTraceWidth;
      result.minHoleSize = minHoleSize;

    } catch (error) {
      result.errors!.push(`解析错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }, []);

  // 检测Gerber文件类型
  const detectGerberFileType = (filename: string): string | null => {
    const ext = filename.toLowerCase();
    const typeMap: Record<string, string> = {
      '.gtl': 'Top Copper',
      '.gbl': 'Bottom Copper', 
      '.gts': 'Top Solder Mask',
      '.gbs': 'Bottom Solder Mask',
      '.gto': 'Top Silkscreen',
      '.gbo': 'Bottom Silkscreen',
      '.gko': 'Keep Out Layer',
      '.drl': 'Drill File',
      '.txt': 'Drill File',
      '.gbr': 'Gerber Layer'
    };

    for (const [extension, type] of Object.entries(typeMap)) {
      if (ext.endsWith(extension)) {
        return type;
      }
    }
    return null;
  };

  // 分析ZIP文件中的Gerber文件
  const analyzeZipFile = useCallback(async (file: File): Promise<GerberAnalysisResult> => {
    const result: GerberAnalysisResult = {
      fileTypes: [],
      errors: [],
      warnings: []
    };

    try {
      const zip = await JSZip.loadAsync(file);
      const gerberFiles: { name: string; content: string }[] = [];
      
      // 提取所有可能的Gerber文件
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const ext = filename.toLowerCase();
          if (ext.match(/\.(gbr|gtl|gbl|gts|gbs|gto|gbo|gko|drl|txt)$/)) {
            try {
              const content = await zipEntry.async('text');
              gerberFiles.push({ name: filename, content });
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

      // 分析每个Gerber文件
      let totalDrillCount = 0;
      let hasGoldFingers = false;
      let hasVias = false;
      let minTraceWidth: number | undefined;
      let minHoleSize: number | undefined;
      let dimensions: GerberAnalysisResult['dimensions'];
      
      for (const gerberFile of gerberFiles) {
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
        
        if (analysis.dimensions && !dimensions) {
          dimensions = analysis.dimensions;
        }
        
        if (analysis.errors) {
          result.errors!.push(...analysis.errors);
        }
        
        if (analysis.warnings) {
          result.warnings!.push(...analysis.warnings);
        }
      }

      // 估算层数
      const copperLayers = result.fileTypes!.filter(type => 
        type.includes('Copper') || type.includes('Top') || type.includes('Bottom')
      ).length;
      
      result.layers = Math.max(2, copperLayers); // 至少2层
      result.drillCount = totalDrillCount;
      result.hasGoldFingers = hasGoldFingers;
      result.hasVias = hasVias;
      result.minTraceWidth = minTraceWidth;
      result.minHoleSize = minHoleSize;
      result.dimensions = dimensions;

      // 去重文件类型
      result.fileTypes = [...new Set(result.fileTypes!)];

    } catch (error) {
      result.errors!.push(`ZIP文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }, [analyzeGerberContent]);

  // 分析单个Gerber文件
  const analyzeSingleFile = useCallback(async (file: File): Promise<GerberAnalysisResult> => {
    try {
      const content = await file.text();
      const analysis = await analyzeGerberContent(content, file.name);
      return {
        layers: 2, // 单文件默认2层
        ...analysis,
        fileTypes: analysis.fileTypes || [],
        errors: analysis.errors || [],
        warnings: analysis.warnings || []
      };
    } catch (error) {
      return {
        fileTypes: [],
        errors: [`文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings: []
      };
    }
  }, [analyzeGerberContent]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange?.(file);

    if (file && onGerberAnalysis) {
      setIsAnalyzing(true);
      setAnalysisResult(null);

      try {
        let result: GerberAnalysisResult;
        
        if (file.name.toLowerCase().endsWith('.zip')) {
          result = await analyzeZipFile(file);
        } else {
          result = await analyzeSingleFile(file);
        }

        setAnalysisResult(result);
        onGerberAnalysis(result);

        // 自动填充表单字段
        if (onFormUpdate && result) {
          const formUpdates = mapGerberAnalysisToForm(result, {});
          onFormUpdate(formUpdates);
        }

      } catch (error) {
        const errorResult: GerberAnalysisResult = {
          fileTypes: [],
          errors: [`分析失败: ${error instanceof Error ? error.message : '未知错误'}`],
          warnings: []
        };
        setAnalysisResult(errorResult);
        onGerberAnalysis?.(errorResult);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isAnalyzing}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      />
      
      {value && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}

      {isAnalyzing && (
        <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Analyzing Gerber file...
        </div>
      )}

      {analysisResult && onGerberAnalysis && (
        <div className="mt-4 space-y-4">
          {/* 标题 */}
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <FileCheck className="h-5 w-5 text-green-600" />
            Gerber Analysis Result
          </div>

          {/* 主要信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 尺寸信息 */}
            {analysisResult.dimensions && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-800">Board Dimensions</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResult.dimensions.width} × {analysisResult.dimensions.height}
                </div>
                <div className="text-sm text-gray-500 uppercase">
                  {analysisResult.dimensions.unit}
                </div>
              </div>
            )}

            {/* 层数信息 */}
            {analysisResult.layers && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-800">PCB Layers</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {analysisResult.layers}
                </div>
                <div className="text-sm text-gray-500">
                  Estimated layers
                </div>
              </div>
            )}

            {/* 钻孔数量 */}
            {analysisResult.drillCount !== undefined && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-gray-800">Drill Holes</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {analysisResult.drillCount}
                </div>
                <div className="text-sm text-gray-500">
                  Total count
                </div>
              </div>
            )}
          </div>

          {/* 技术参数 */}
          {(analysisResult.minTraceWidth || analysisResult.minHoleSize) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-800">Technical Specifications</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.minTraceWidth && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600">Min Trace Width</span>
                    <span className="font-medium text-gray-800">{analysisResult.minTraceWidth}</span>
                  </div>
                )}
                {analysisResult.minHoleSize && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600">Min Hole Size</span>
                    <span className="font-medium text-gray-800">{analysisResult.minHoleSize}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 文件类型 */}
          {analysisResult.fileTypes && analysisResult.fileTypes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-gray-800">Detected File Types</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.fileTypes.map((type, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 特殊功能 */}
          {(analysisResult.hasGoldFingers || analysisResult.hasVias) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-800">Special Features</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.hasGoldFingers && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Gold Fingers</span>
                  </div>
                )}
                {analysisResult.hasVias && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-800 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Vias Detected</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {analysisResult.warnings && analysisResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Warnings</span>
              </div>
              <ul className="space-y-1">
                {analysisResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-yellow-700">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 错误信息 */}
          {analysisResult.errors && analysisResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Gerber files analyzed successfully! Form fields have been auto-populated based on the analysis.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 