import { GerberAnalysisResult } from '@/app/components/ui/FileUpload';
import { PcbQuoteForm } from '@/types/pcbQuoteForm';
import { MinTrace, MinHole } from '@/types/form';

/**
 * Gerber文件分析工具函数
 * 
 * 使用示例：
 * ```tsx
 * import { FileUpload } from '@/app/components/ui/FileUpload';
 * import { mapGerberAnalysisToForm, generateAnalysisReport } from '@/lib/utils/gerberAnalysisHelper';
 * 
 * function PcbQuoteForm() {
 *   const [formData, setFormData] = useState<Partial<PcbQuoteForm>>({});
 *   const [analysisReport, setAnalysisReport] = useState<string>('');
 * 
 *   const handleGerberAnalysis = (result: GerberAnalysisResult) => {
 *     // 生成分析报告
 *     const report = generateAnalysisReport(result);
 *     setAnalysisReport(report);
 *   };
 * 
 *   const handleFormUpdate = (updates: Partial<PcbQuoteForm>) => {
 *     setFormData(prev => ({ ...prev, ...updates }));
 *   };
 * 
 *   return (
 *     <div>
 *       <FileUpload
 *         onFileChange={(file) => console.log('File selected:', file)}
 *         onGerberAnalysis={handleGerberAnalysis}
 *         onFormUpdate={handleFormUpdate}
 *       />
 *       {analysisReport && (
 *         <div className="mt-4 p-4 bg-gray-50 rounded-md">
 *           <pre className="whitespace-pre-wrap text-sm">{analysisReport}</pre>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * 根据Gerber解析结果自动填充PCB表单字段
 */
export function mapGerberAnalysisToForm(
  analysis: GerberAnalysisResult,
  currentForm: Partial<PcbQuoteForm>
): Partial<PcbQuoteForm> {
  const updates: Partial<PcbQuoteForm> = { ...currentForm };

  // 映射尺寸信息
  if (analysis.dimensions) {
    const { width, height, unit } = analysis.dimensions;
    
    // 转换为厘米（项目中使用cm作为单位）
    let widthCm = width;
    let heightCm = height;
    
    if (unit === 'inch') {
      widthCm = width * 2.54;
      heightCm = height * 2.54;
    } else if (unit === 'mm') {
      widthCm = width / 10;
      heightCm = height / 10;
    }

    updates.singleDimensions = {
      length: Math.round(heightCm * 100) / 100,
      width: Math.round(widthCm * 100) / 100
    };
  }

  // 映射层数
  if (analysis.layers && analysis.layers > 0) {
    updates.layers = analysis.layers;
  }

  // 映射钻孔数
  if (analysis.drillCount !== undefined) {
    updates.holeCount = analysis.drillCount;
  }

  // 映射金手指
  if (analysis.hasGoldFingers !== undefined) {
    updates.goldFingers = analysis.hasGoldFingers;
  }

  // 根据最小线宽推断minTrace
  if (analysis.minTraceWidth) {
    const traceWidthMm = analysis.minTraceWidth;
    // 根据线宽范围映射到对应的MinTrace枚举值
    if (traceWidthMm >= 0.25) {
      updates.minTrace = MinTrace.TenTen;
    } else if (traceWidthMm >= 0.2) {
      updates.minTrace = MinTrace.EightEight;
    } else if (traceWidthMm >= 0.15) {
      updates.minTrace = MinTrace.SixSix;
    } else if (traceWidthMm >= 0.125) {
      updates.minTrace = MinTrace.FiveFive;
    } else if (traceWidthMm >= 0.1) {
      updates.minTrace = MinTrace.FourFour;
    } else {
      updates.minTrace = MinTrace.ThreeFive;
    }
  }

  // 根据最小孔径推断minHole
  if (analysis.minHoleSize) {
    const holeSizeMm = analysis.minHoleSize;
    // 根据孔径范围映射到对应的MinHole枚举值
    if (holeSizeMm >= 0.3) {
      updates.minHole = MinHole.ZeroThree;
    } else if (holeSizeMm >= 0.25) {
      updates.minHole = MinHole.ZeroTwoFive;
    } else if (holeSizeMm >= 0.2) {
      updates.minHole = MinHole.ZeroTwo;
    } else {
      updates.minHole = MinHole.ZeroOneFive;
    }
  }

  // 根据文件类型推断一些特性
  if (analysis.fileTypes) {
    const fileTypes = analysis.fileTypes;
    
    // 检测是否有阻抗控制层
    if (fileTypes.some(type => type.toLowerCase().includes('impedance'))) {
      updates.impedance = true;
    }
    
    // 检测是否有多层结构
    const copperLayers = fileTypes.filter(type => 
      type.includes('Copper') || type.includes('Top') || type.includes('Bottom')
    ).length;
    
    if (copperLayers > 2) {
      updates.layers = Math.max(updates.layers || 2, copperLayers);
    }
  }

  return updates;
}

/**
 * 生成Gerber分析报告的可读文本
 */
export function generateAnalysisReport(analysis: GerberAnalysisResult): string {
  const sections: string[] = [];

  sections.push('=== Gerber File Analysis Report ===\n');

  if (analysis.dimensions) {
    sections.push(`Board Dimensions: ${analysis.dimensions.width} × ${analysis.dimensions.height} ${analysis.dimensions.unit}`);
  }

  if (analysis.layers) {
    sections.push(`Estimated Layers: ${analysis.layers}`);
  }

  if (analysis.drillCount !== undefined) {
    sections.push(`Total Drill Holes: ${analysis.drillCount}`);
  }

  if (analysis.minTraceWidth) {
    sections.push(`Minimum Trace Width: ${analysis.minTraceWidth} mm`);
  }

  if (analysis.minHoleSize) {
    sections.push(`Minimum Hole Size: ${analysis.minHoleSize} mm`);
  }

  if (analysis.fileTypes && analysis.fileTypes.length > 0) {
    sections.push(`\nDetected File Types:`);
    analysis.fileTypes.forEach(type => {
      sections.push(`  - ${type}`);
    });
  }

  const features: string[] = [];
  if (analysis.hasGoldFingers) features.push('Gold Fingers');
  if (analysis.hasVias) features.push('Vias');
  
  if (features.length > 0) {
    sections.push(`\nDetected Features: ${features.join(', ')}`);
  }

  if (analysis.warnings && analysis.warnings.length > 0) {
    sections.push(`\nWarnings:`);
    analysis.warnings.forEach(warning => {
      sections.push(`  ⚠️ ${warning}`);
    });
  }

  if (analysis.errors && analysis.errors.length > 0) {
    sections.push(`\nErrors:`);
    analysis.errors.forEach(error => {
      sections.push(`  ❌ ${error}`);
    });
  }

  return sections.join('\n');
}

/**
 * 验证Gerber分析结果的完整性
 */
export function validateAnalysisResult(analysis: GerberAnalysisResult): {
  isValid: boolean;
  missingInfo: string[];
  recommendations: string[];
} {
  const missingInfo: string[] = [];
  const recommendations: string[] = [];

  if (!analysis.dimensions) {
    missingInfo.push('Board dimensions');
    recommendations.push('Please ensure your Gerber files contain valid coordinate data');
  }

  if (!analysis.layers || analysis.layers < 1) {
    missingInfo.push('Layer count');
    recommendations.push('Please include all copper layer files (GTL, GBL, etc.)');
  }

  if (analysis.drillCount === undefined || analysis.drillCount === 0) {
    missingInfo.push('Drill information');
    recommendations.push('Please include drill files (.drl or .txt)');
  }

  if (!analysis.fileTypes || analysis.fileTypes.length === 0) {
    missingInfo.push('File type detection');
    recommendations.push('Please ensure files have proper Gerber extensions');
  }

  if (analysis.errors && analysis.errors.length > 0) {
    recommendations.push('Please fix the errors listed in the analysis result');
  }

  const isValid = missingInfo.length === 0 && (!analysis.errors || analysis.errors.length === 0);

  return {
    isValid,
    missingInfo,
    recommendations
  };
}

/**
 * 根据分析结果推荐PCB工艺参数
 */
export function recommendPcbSpecs(analysis: GerberAnalysisResult): {
  surfaceFinish?: string;
  testMethod?: string;
  specialRequirements?: string[];
} {
  const recommendations: {
    surfaceFinish?: string;
    testMethod?: string;
    specialRequirements?: string[];
  } = {};
  const specialRequirements: string[] = [];

  // 根据金手指推荐表面处理
  if (analysis.hasGoldFingers) {
    recommendations.surfaceFinish = 'enig'; // 沉金工艺适合金手指
    specialRequirements.push('Gold fingers detected - ENIG surface finish recommended');
  }

  // 根据层数推荐测试方法
  if (analysis.layers) {
    if (analysis.layers >= 6) {
      recommendations.testMethod = 'fixture'; // 多层板建议用测试架
      specialRequirements.push('Multi-layer board - fixture testing recommended');
    } else {
      recommendations.testMethod = 'flyingProbe'; // 简单板用飞针测试
    }
  }

  // 根据最小线宽推荐特殊要求
  if (analysis.minTraceWidth && analysis.minTraceWidth < 0.1) {
    specialRequirements.push('Fine pitch traces detected - high precision manufacturing required');
  }

  // 根据最小孔径推荐特殊要求
  if (analysis.minHoleSize && analysis.minHoleSize < 0.2) {
    specialRequirements.push('Small via holes detected - precision drilling required');
  }

  return {
    ...recommendations,
    specialRequirements: specialRequirements.length > 0 ? specialRequirements : undefined
  };
} 