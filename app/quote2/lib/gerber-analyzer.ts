import * as JSZip from 'jszip';
import type { GerberAnalysisResult, JSZipFileEntry } from '../types/gerber';
import whatsThatGerber from 'whats-that-gerber';

export async function analyzeGerberFiles(
  file: File,
  onProgress?: (progress: { current: number; total: number; currentFile: string }) => void
): Promise<GerberAnalysisResult> {
  const result: GerberAnalysisResult = {
    fileTypes: [],
    errors: [],
    warnings: [],
    layers: 0,
    drillCount: 0,
    hasGoldFingers: false,
  };

  try {
    onProgress?.({ current: 0, total: 1, currentFile: file.name });

    let fileList: Array<{ name: string; content: string }> = [];

    // 根据文件类型处理
    if (file.name.toLowerCase().endsWith('.zip')) {
      fileList = await extractZipFiles(file);
    } else if (file.name.toLowerCase().endsWith('.rar')) {
      // 暂时禁用 RAR 支持，提供友好提示
      result.errors = [
        'RAR file support is temporarily unavailable. Please extract your RAR file and upload as ZIP or individual files instead.',
        'We apologize for the inconvenience and are working to restore RAR support soon.'
      ];
      result.warnings = [
        'Tip: You can use WinRAR, 7-Zip, or other tools to extract the RAR file and create a ZIP file instead.'
      ];
      return result;
    } else {
      // 单个文件
      const content = await file.text();
      fileList = [{ name: file.name, content }];
    }

    if (fileList.length === 0) {
      result.errors = ['No valid files found in the archive'];
      return result;
    }

    // 使用 whats-that-gerber 分析文件类型
    const filenames = fileList.map(file => file.name);
    const typeByFilename = whatsThatGerber(filenames);

    // 分析文件
    const analysisResults = await analyzeFileList(fileList, typeByFilename, onProgress);
    // 合并结果
    const merged = mergeAnalysisResults(analysisResults);
    return merged;

  } catch (error) {
    result.errors = [error instanceof Error ? error.message : 'Unknown analysis error'];
    return result;
  }
}

async function extractZipFiles(file: File): Promise<Array<{ name: string; content: string }>> {
  const JSZipConstructor = JSZip as unknown as new() => JSZip;
  const zip = new JSZipConstructor();
  const zipData = await zip.loadAsync(file);
  const fileList: Array<{ name: string; content: string }> = [];
  
  for (const [filename, fileData] of Object.entries(zipData.files)) {
    const zipFileData = fileData as JSZipFileEntry;
    if (!zipFileData.dir) {
      // 使用 whats-that-gerber 判断文件类型，只处理识别出的 Gerber 或 Drill 文件
      const fileTypeInfo = whatsThatGerber([filename])[filename];
      if (fileTypeInfo && (fileTypeInfo.type !== null || fileTypeInfo.side !== null)) {
        const content = await zipFileData.async('text');
        fileList.push({ name: filename, content });
      }
    }
  }
  
  return fileList;
}

async function analyzeFileList(
  fileList: Array<{ name: string; content: string }>,
  typeByFilename: Record<string, { type: string | null; side: string | null }>,
  onProgress?: (progress: { current: number; total: number; currentFile: string }) => void
): Promise<GerberAnalysisResult[]> {
  const results: GerberAnalysisResult[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    onProgress?.({ current: i + 1, total: fileList.length, currentFile: file.name });

    // 初始化 fileTypeInfo，确保在 catch 块中可用
    let fileTypeInfo: { type: string | null; side: string | null } | undefined;

    try {
      fileTypeInfo = typeByFilename[file.name];
      if (fileTypeInfo) {
        const analysis = await analyzeSingleGerberFile(file.name, file.content, fileTypeInfo);
        results.push(analysis);
      } else {
         results.push({
            fileTypes: [], // whats-that-gerber couldn't identify
            errors: [`Could not identify file type for ${file.name}`],
            warnings: []
         });
      }

    } catch (error) {
      results.push({
        fileTypes: fileTypeInfo?.type ? [fileTypeInfo.type] : [], // 使用安全访问
        errors: [`Failed to analyze ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    }
  }

  return results;
}

// 工具函数：解析单位和格式
function parseGerberUnitAndFormat(content: string): { unit: 'mm' | 'inch', xInt: number, xDec: number, yInt: number, yDec: number } {
  // 默认单位 inch，格式 2.4
  let unit: 'mm' | 'inch' = 'inch';
  let xInt = 2, xDec = 4, yInt = 2, yDec = 4;
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // 单位
    const mo = line.match(/%MO(IN|MM)\*%/i);
    if (mo) {
      unit = mo[1].toLowerCase() === 'mm' ? 'mm' : 'inch';
    }
    // 格式
    const fs = line.match(/%FS[LX]?A?X(\d)(\d)Y(\d)(\d)\*%/i);
    if (fs) {
      xInt = parseInt(fs[1], 10);
      xDec = parseInt(fs[2], 10);
      yInt = parseInt(fs[3], 10);
      yDec = parseInt(fs[4], 10);
    }
    // 兼容 KiCad/部分老格式
    const fs2 = line.match(/%FS[LX]?A?X(\d)(\d)Y(\d)(\d)/i);
    if (fs2) {
      xInt = parseInt(fs2[1], 10);
      xDec = parseInt(fs2[2], 10);
      yInt = parseInt(fs2[3], 10);
      yDec = parseInt(fs2[4], 10);
    }
    // 只需解析一次
    if (mo || fs || fs2) break;
  }
  return { unit, xInt, xDec, yInt, yDec };
}

async function analyzeSingleGerberFile(fileName: string, content: string, whatsThatGerberType: { type: string | null; side: string | null }): Promise<GerberAnalysisResult> {
  const fileType = whatsThatGerberType.type; // 使用 whats-that-gerber 的判断结果
  const result: GerberAnalysisResult = {
    fileTypes: fileType ? [fileType] : [],
    errors: [],
    warnings: [],
    layers: 0,
    drillCount: 0,
    hasGoldFingers: false,
    minTraceWidth: undefined,
    minHoleSize: undefined,
    dimensions: undefined,
  };

  if (content.length === 0) {
    result.errors = ['File is empty'];
    return result;
  }

  const lowerName = fileName.toLowerCase();
  // 1. 外形层，提取尺寸
  if (fileType === 'outline') { // 根据 whats-that-gerber 的类型判断
    // 解析单位和格式
    const { unit, xInt, xDec, yInt, yDec } = parseGerberUnitAndFormat(content);
    // 匹配所有 X、Y 坐标
    const xyMatches = [...content.matchAll(/X([\d\-]+)Y([\d\-]+)/g)];
    const xs: number[] = [], ys: number[] = [];
    for (const m of xyMatches) {
      // 解析 X
      let xRaw = m[1];
      let yRaw = m[2];
      // 处理负号
      let xVal = parseInt(xRaw, 10);
      let yVal = parseInt(yRaw, 10);
      // 按格式补零（Gerber 允许省略前导零或后导零，这里假设常见的前导零省略）
      // 先转为字符串，补足位数
      const xLen = xInt + xDec;
      const yLen = yInt + yDec;
      xRaw = xRaw.padStart(xLen, '0');
      yRaw = yRaw.padStart(yLen, '0');
      // 重新解析
      xVal = parseInt(xRaw, 10) / Math.pow(10, xDec);
      yVal = parseInt(yRaw, 10) / Math.pow(10, yDec);
      // 单位换算
      if (unit === 'inch') {
        xVal *= 25.4;
        yVal *= 25.4;
      }
      xs.push(xVal);
      ys.push(yVal);
    }
    if (xs.length && ys.length) {
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const width = Math.abs(maxX - minX);
      const height = Math.abs(maxY - minY);
      result.dimensions = { width, height, unit: 'mm' };
    }
  }

  // 2. 层数统计（顶层/底层/内层）
  if (fileType === 'copper') { // 根据 whats-that-gerber 的类型判断
    result.layers = 1;
  }

  // 3. 钻孔数和最小孔径
  if (fileType === 'drill') { // 根据 whats-that-gerber 的类型判断
    // 钻孔数
    const drillMatches = content.match(/[XY][\d.-]+/g);
    result.drillCount = drillMatches ? Math.floor(drillMatches.length / 2) : 0;
    // 最小孔径
    let minHole = undefined;
    // Excellon格式: TxxCyy
    const toolMatches = [...content.matchAll(/T\d+C([\d\.]+)/g)];
    for (const m of toolMatches) {
      const v = parseFloat(m[1]);
      if (!isNaN(v)) minHole = minHole === undefined ? v : Math.min(minHole, v);
    }
    // Gerber格式: %ADDxxCyy*%
    const addMatches = [...content.matchAll(/%ADD\d+C([\d\.]+)\*%/g)];
    for (const m of addMatches) {
      const v = parseFloat(m[1]);
      if (!isNaN(v)) minHole = minHole === undefined ? v : Math.min(minHole, v);
    }
    if (minHole !== undefined) {
      result.minHoleSize = minHole;
    }
  }

  // 4. 金手指
  // whats-that-gerber 不直接提供金手指信息，保留原有的内容匹配判断
  if (lowerName.includes('gold') || lowerName.includes('finger') || content.includes('GOLD') || content.includes('FINGER')) {
    result.hasGoldFingers = true;
  }

  // 5. 最小线宽（只在铜层）
  if (fileType === 'copper') { // 根据 whats-that-gerber 的类型判断
    // Gerber DxxCyy格式，C为线宽
    let minTrace = undefined;
    const dMatches = [...content.matchAll(/D\d+C([\d\.]+)/g)];
    for (const m of dMatches) {
      const v = parseFloat(m[1]);
      if (!isNaN(v)) minTrace = minTrace === undefined ? v : Math.min(minTrace, v);
    }
    // 也可能有%ADDxxCyy*%格式
    const addMatches = [...content.matchAll(/%ADD\d+C([\d\.]+)\*%/g)];
    for (const m of addMatches) {
      const v = parseFloat(m[1]);
      if (!isNaN(v)) minTrace = minTrace === undefined ? v : Math.min(minTrace, v);
    }
    if (minTrace !== undefined) {
      result.minTraceWidth = minTrace;
    }
  }

  return result;
}

function mergeAnalysisResults(results: GerberAnalysisResult[]): GerberAnalysisResult {
  const merged: GerberAnalysisResult = {
    layers: results.reduce((sum, r) => sum + (r.layers || 0), 0),
    fileTypes: results.flatMap(r => r.fileTypes || []),
    errors: results.flatMap(r => r.errors || []),
    warnings: results.flatMap(r => r.warnings || []),
    drillCount: results.reduce((sum, r) => sum + (r.drillCount || 0), 0),
    hasGoldFingers: results.some(r => r.hasGoldFingers),
    minTraceWidth: undefined,
    minHoleSize: undefined,
    dimensions: undefined,
  };

  // 合并最小线宽
  const traceWidths = results.map(r => r.minTraceWidth).filter(v => v !== undefined);
  if (traceWidths.length) merged.minTraceWidth = Math.min(...traceWidths);
  // 合并最小孔径
  const holeSizes = results.map(r => r.minHoleSize).filter(v => v !== undefined);
  if (holeSizes.length) merged.minHoleSize = Math.min(...holeSizes);
  // 合并尺寸（取最大）
  const dims = results.map(r => r.dimensions).filter(v => v !== undefined);
  if (dims.length) {
    merged.dimensions = dims.reduce((acc, cur) => {
      return {
        width: Math.max(acc.width, cur.width),
        height: Math.max(acc.height, cur.height),
        unit: 'mm'
      };
    });
  }

  // 去重文件类型
  if (merged.fileTypes) {
    const uniqueFileTypes = [];
    const seen = new Set();
    for (const type of merged.fileTypes) {
      if (!seen.has(type)) {
        seen.add(type);
        uniqueFileTypes.push(type);
      }
    }
    merged.fileTypes = uniqueFileTypes;
  }
  return merged;
}