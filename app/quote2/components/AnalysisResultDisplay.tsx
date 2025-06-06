import React from 'react';
import { CheckCircle, AlertTriangle, Settings } from 'lucide-react';

// FrontendAnalysisResult 类型定义
export interface FrontendAnalysisResult {
  dimensions?: {
    width?: number;  // 毫米
    height?: number; // 毫米
  };
  layers?: string[];
  hasGoldFingers?: boolean;
  // 可选的扩展字段
  errors?: string[];
  minTraceWidth?: number;
  minHoleSize?: number;
  drillCount?: number;
  hasVias?: boolean;
}

interface AnalysisResultDisplayProps {
  analysisResult: FrontendAnalysisResult | null;
  isAnalyzing: boolean;
}

export function AnalysisResultDisplay({ analysisResult, isAnalyzing }: AnalysisResultDisplayProps) {
  if (isAnalyzing) {
    return null;
  }

  return (
    <div className="mt-4">
      {/* 错误信息 */}
      {analysisResult?.errors && analysisResult.errors.length > 0 && (
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
      {(!analysisResult?.errors || analysisResult.errors.length === 0) && (
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
          {analysisResult?.dimensions && (
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-xs text-blue-600 font-medium">Dimensions</div>
              <div className="font-semibold text-gray-900">
                {analysisResult.dimensions.width} × {analysisResult.dimensions.height} mm
              </div>
            </div>
          )}
          
          {/* 层数 */}
          {analysisResult?.layers && (
            <div className="bg-green-50 p-2 rounded">
              <div className="text-xs text-green-600 font-medium">Layers</div>
              <div className="font-semibold text-gray-900">{analysisResult.layers.length}</div>
            </div>
          )}
          
          {/* 最小线宽 */}
          {analysisResult?.minTraceWidth && (
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-xs text-purple-600 font-medium">Min Trace</div>
              <div className="font-semibold text-gray-900">{analysisResult.minTraceWidth}mm</div>
            </div>
          )}
          
          {/* 最小孔径 */}
          {analysisResult?.minHoleSize && (
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600 font-medium">Min Hole</div>
              <div className="font-semibold text-gray-900">{analysisResult.minHoleSize}mm</div>
            </div>
          )}
          
          {/* 钻孔数量 */}
          {analysisResult?.drillCount && (
            <div className="bg-indigo-50 p-2 rounded">
              <div className="text-xs text-indigo-600 font-medium">Drill Count</div>
              <div className="font-semibold text-gray-900">{analysisResult.drillCount}</div>
            </div>
          )}
        </div>
        
        {/* 特殊功能 - 紧凑显示 */}
        {(analysisResult?.hasGoldFingers || analysisResult?.hasVias) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Features:</div>
            <div className="flex flex-wrap gap-2">
              {analysisResult.hasGoldFingers && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Gold Fingers</span>
              )}
              {analysisResult.hasVias && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Vias</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 