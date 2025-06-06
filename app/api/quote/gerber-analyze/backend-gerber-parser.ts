import * as JSZip from 'jszip';
import type { GerberAnalysisResult, JSZipFileEntry } from '@/app/quote2/types/gerber';
import gerberParser from 'gerber-parser';
import whatsThatGerber from 'whats-that-gerber';

interface ParserSetUnitsEvent {
  type: 'set';
  line: number;
  prop: 'units';
  value: 'in' | 'mm';
}

interface ParserSetFormatEvent {
  type: 'set';
  line: number;
  prop: 'format';
  value: { places: [number, number]; };
}

interface ParserSetNotaEvent {
  type: 'set';
  line: number;
  prop: 'nota';
  value: string;
}

interface ParserSetEpsilonEvent {
  type: 'set';
  line: number;
  prop: 'epsilon';
  value: number;
}

interface ParserSetModeEvent {
  type: 'set';
  line: number;
  prop: 'mode';
  value: string;
}

interface ParserSetArcEvent {
  type: 'set';
  line: number;
  prop: 'arc';
  value: string;
}

interface ParserSetRegionEvent {
  type: 'set';
  line: number;
  prop: 'region';
  value: boolean;
}

interface ParserSetOtherEvent {
  type: 'set';
  line: number;
  prop: string;
  value: unknown; // Fallback for other unknown set properties
}

interface ParserToolEvent {
  type: 'tool';
  line: number;
  code: string;
  tool: { shape: string; params: number[]; hole: number[]; diameter?: number; };
}

interface ParserOpEvent {
  type: 'op';
  line: number;
  op: string;
  coord: { x?: number; y?: number; i?: number; j?: number; };
}

interface ParserGenericEvent {
  type: string;
  [key: string]: unknown;
}

type ParserDataEvent =
  | ParserSetUnitsEvent
  | ParserSetFormatEvent
  | ParserSetNotaEvent
  | ParserSetEpsilonEvent
  | ParserSetModeEvent
  | ParserSetArcEvent
  | ParserSetRegionEvent
  | ParserSetOtherEvent
  | ParserToolEvent
  | ParserOpEvent
  | ParserGenericEvent;

export async function analyzeGerberFilesBackend(file: File): Promise<GerberAnalysisResult> {
  // console.log('Starting analyzeGerberFilesBackend for file:', file.name);

  const result: GerberAnalysisResult = {
    fileTypes: [],
    errors: [],
    warnings: [],
    layers: 0,
    drillCount: 0,
    hasGoldFingers: false,
    minTraceWidth: undefined,
    minHoleSize: undefined,
    dimensions: undefined,
  };

  try {
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

    // 分析文件
    const analysisResults = await analyzeFileList(fileList);
    // 合并结果
    const merged: GerberAnalysisResult = mergeAnalysisResults(analysisResults);

    return merged;

  } catch (error) {
    result.errors = [error instanceof Error ? error.message : 'Unknown analysis error'];
    return result;
  }
}

export async function extractZipFiles(file: File): Promise<Array<{ name: string; content: string }>> {
  const JSZipConstructor = JSZip as unknown as new () => JSZip;
  const zip = new JSZipConstructor();
  const zipData = await zip.loadAsync(await file.arrayBuffer());
  const fileList: Array<{ name: string; content: string }> = [];

  for (const [filename, fileData] of Object.entries(zipData.files)) {
    const zipFileData = fileData as JSZipFileEntry;
    if (!zipFileData.dir) {
      // With tracespace, we no longer need to pre-filter by extension
      // const isValid = isValidGerberFile(filename);

      // if (isValid) {
      const content = await zipFileData.async('text');
      fileList.push({ name: filename, content });
      // }
    }
  }

  return fileList;
}

export async function analyzeSingleGerberFile(fileName: string, content: string): Promise<{ analysis: GerberAnalysisResult; isBoardOutlineInternal: boolean }> {
  const result: GerberAnalysisResult = {
    fileTypes: [],
    errors: [],
    warnings: [],
    layers: 0,
    drillCount: 0,
    hasGoldFingers: false,
    minTraceWidth: undefined,
    minHoleSize: undefined,
    dimensions: undefined,
  };
  let isBoardOutlineInternal = false;

  if (content.length === 0) {
    result.errors = ['File is empty'];
    return { analysis: result, isBoardOutlineInternal };
  }

  // Attempt to identify file type using whats-that-gerber
  try {
    const wtgResult = whatsThatGerber([fileName]); // Pass filename in an array
    const fileTypeInfo = wtgResult[fileName];

    if (fileTypeInfo && fileTypeInfo.type) {
      let typeString = '';
      if (fileTypeInfo.side) {
        // Capitalize first letter of side and type for consistency with current format
        const side = fileTypeInfo.side.charAt(0).toUpperCase() + fileTypeInfo.side.slice(1);
        const type = fileTypeInfo.type.charAt(0).toUpperCase() + fileTypeInfo.type.slice(1);
        if (fileTypeInfo.type === 'drill' || fileTypeInfo.type === 'outline') {
          typeString = type; // e.g., "Drill", "Outline"
          if (fileTypeInfo.type === 'outline') {
            isBoardOutlineInternal = true; // Mark as board outline
          }
        } else {
          typeString = `${side} ${type}`; // e.g., "Top Copper", "Bottom Soldermask"
        }
      } else {
        const type = fileTypeInfo.type.charAt(0).toUpperCase() + fileTypeInfo.type.slice(1);
        typeString = type; // e.g., "Drawing"
        // An outline might not have a side according to whats-that-gerber, check type only
        if (fileTypeInfo.type === 'outline') {
          isBoardOutlineInternal = true; // Mark as board outline
        }
      }
      result.fileTypes!.push(typeString);
      // console.log(`File type from whats-that-gerber for ${fileName}: ${typeString}`);
    } else {
      result.warnings!.push(`whats-that-gerber could not identify type for ${fileName}.`);
      // Fallback to existing inference if whats-that-gerber doesn't provide a type
      // const inferredLayerTypes = inferLayerTypeFromFileName(fileName); // REMOVED
      // if (inferredLayerTypes.length > 0) { // REMOVED
      //   result.fileTypes = Array.from(new Set([...result.fileTypes!, ...inferredLayerTypes])); // REMOVED
      // } // REMOVED
    }
  } catch (wtgError) {
    console.error(`Error using whats-that-gerber for ${fileName}:`, wtgError);
    result.warnings!.push(`Error with whats-that-gerber: ${wtgError instanceof Error ? wtgError.message : String(wtgError)}. Falling back.`);
    // const inferredLayerTypes = inferLayerTypeFromFileName(fileName); // REMOVED
    // if (inferredLayerTypes.length > 0) { // REMOVED
    //   result.fileTypes = Array.from(new Set([...result.fileTypes!, ...inferredLayerTypes])); // REMOVED
    // } // REMOVED
  }

  try {
    // console.log(`Analyzing file: ${fileName}`);
    // Initialize gerber-parser without content directly
    const parser = gerberParser({});

    // Add a generic event listener to capture all events for debugging
    parser.on('*', (eventName: string, ...args: unknown[]) => {
      // console.log(`Parser Event: ${eventName}`, ...args);
    });

    parser.on('end', () => {
      // console.log('Parser Event: end - Parsing finished.');
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const currentHoleSizesNative: number[] = []; // Store in native units first
    const toolTraceWidthsNative: number[] = [];  // Store in native units first
    let detectedUnit: 'mm' | 'inch' = 'mm'; // Default to mm, will update if detected

    let drillOperationsCount = 0; // Added counter for actual drill operations

    // Listen for data events to extract dimensions and other information
    parser.on('data', (data: ParserDataEvent) => { // Fix: changed type to ParserDataEvent
      // console.log('Parser Event: data', data); // Keep this for detailed debugging if needed

      // Detect unit from 'set' event
      if (data.type === 'set' && data.prop === 'units') {
        const unitsData = data as ParserSetUnitsEvent;
        detectedUnit = unitsData.value === 'in' ? 'inch' : 'mm';
        // console.log(`Detected unit from data event: ${detectedUnit}`);
      }

   

      // For operation commands (move, interpolate) with coordinates
      if (data.type === 'op') {
        const opData = data as ParserOpEvent;
        const x = opData.coord?.x;
        const y = opData.coord?.y;

        // The coordinates from data.coord are already scaled by gerber-parser
        if (x !== undefined && y !== undefined) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          // console.log(`Processed (x, y): (${x}, ${y}) - Current min/max: (${minX},${minY}) to (${maxX},${maxY})`);
        }

        // If the operation is a 'flash' (typically D03 in Gerber, indicating a hole or pad)
        // or a 'drill' operation (Excellon specific).
        // gerber-parser normalizes D03 to 'flash' and Excellon drill ops to 'drill'.
        if (opData.op === 'flash' || opData.op === 'drill') {
          drillOperationsCount++;
        }
      }

      // For drill tool definitions (e.g., T commands represented as 'tool' data type)
      if (data.type === 'tool') {
        const toolData = data as ParserToolEvent;
        if (toolData.tool?.diameter) { // Typically for drill files or round flash tools
          currentHoleSizesNative.push(toolData.tool.diameter);
        }

        // Logic for potential trace widths from aperture definitions
        const { shape, params } = toolData.tool;
        if (params && params.length > 0) {
          if (shape === 'circle' && params.length >= 1) {
            // params[0] is diameter for circle
            toolTraceWidthsNative.push(params[0]);
          } else if ((shape === 'rect' || shape === 'obround') && params.length >= 2) {
            // For rect/obround, traces are usually drawn using the smaller dimension as width.
            // Taking the minimum of the two params is a heuristic for potential trace/clearance width.
            toolTraceWidthsNative.push(Math.min(params[0], params[1]));
          }
          // Note: More complex shapes or specific handling for polygon vertices etc., are not covered here.
        }
      }

      // For drill operations (these might also be 'op' type with specific tool active)
      // This part might need further refinement based on how `gerber-parser` represents drill operations.
      // For now, we'll assume any 'op' might contribute to dimensions if it's a trace/outline.
    });

    parser.on('warning', (warning: { message: string; }) => {
      result.warnings!.push(warning.message || 'Unknown warning');
    });

    parser.on('error', (error: { message: string; }) => {
      result.errors!.push(error.message || 'Unknown error');
    });

    // Start parsing the content
    try {
      parser.write(content);
      parser.end();
    } catch (parseError: unknown) {
      console.error('Error during gerber-parser write/end:', parseError);
      result.errors!.push(`Parser write/end error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // console.log('Parser format:', parser.format);
    // console.log('Has parsed any commands:', hasParsedAnyCommands);

    // After parsing, determine file type and other information
    // Use gerber-parser's detection as a supplementary source or for Drill vs Gerber distinction if not clear
    if (parser.format && parser.format.filetype) {
      const detectedFileTypeByParser = parser.format.filetype === 'gerber' ? 'Gerber' : 'Drill';
      // console.log('Detected file type by gerber-parser:', detectedFileTypeByParser);
      // Add if not already covered by whats-that-gerber or inference, or if it's more specific (e.g. "Drill")
      if (!result.fileTypes?.includes(detectedFileTypeByParser) && (detectedFileTypeByParser === 'Drill' || detectedFileTypeByParser === 'Gerber')) {
        // Only add if not already identified by whats-that-gerber with a more specific type
        // For example, wtg might say "Top Copper", parser says "Gerber". We prefer "Top Copper".
        // However, if wtg found nothing, "Gerber" or "Drill" from parser is valuable.
        const wtgIdentifiedMoreSpecifically = result.fileTypes!.length > 0 && result.fileTypes![0] !== 'Unknown File Type';
        if (!wtgIdentifiedMoreSpecifically) {
          result.fileTypes!.push(detectedFileTypeByParser);
        } else if (!result.fileTypes!.some(ft => ft.toLowerCase().includes(detectedFileTypeByParser.toLowerCase()))) {
          // If wtg identified something, but it's not gerber/drill (e.g. "Drawing"), still add parser's finding.
          result.fileTypes!.push(detectedFileTypeByParser);
        }
      }
      result.layers = 1; // For gerber-parser, assuming one layer per file parsed
    }

    // Fallback if filetype is not directly available from parser.format and whats-that-gerber failed
    if (result.fileTypes!.length === 0) {
      // If after wtg and parser format check, fileTypes is still empty, mark as unknown.
      result.fileTypes!.push('Unknown File Type');
      result.layers = 0; // An unknown file type doesn't contribute as a layer
    } else {
      // If any type was identified (even just "Gerber" or "Drill" or "Unknown File Type" if logic above changes)
      // we assume it's a single layer from this file's perspective.
      // The actual PCB layer count (copper layers) is determined in mergeAnalysisResults.
      result.layers = 1;
    }

    // If dimensions were found from parsed operations
    if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
      let width = maxX - minX;
      let height = maxY - minY;

      // Convert to millimeters if the detected unit is inches
      // @ts-expect-error: This comparison is logically correct, Linter false positive.
      if (detectedUnit === 'inch') {
        width *= 25.4;
        height *= 25.4;
        // console.log(`Converted dimensions to mm: Width: ${width} mm, Height: ${height} mm`);
      }

      result.dimensions = {
        width: width,
        height: height,
        unit: 'mm',
      };
      // console.log('Dimensions extracted from parser data events:', result.dimensions);
    } else {
      // console.log('No valid dimensions found from parser data events.');
      result.errors!.push(`File '${fileName}' could not be parsed for meaningful geometric data to determine dimensions.`);
    }

    result.drillCount = drillOperationsCount;

    // Unit conversion and calculation for hole sizes
    let finalMinHoleSize: number | undefined = undefined;
    if (currentHoleSizesNative.length > 0) {
      let holes = [...currentHoleSizesNative]; // Operate on a copy
      // @ts-expect-error: This comparison is logically correct
      if (detectedUnit === 'inch') {
        // console.log(`Converting ${holes.length} hole sizes from inches to mm.`);
        holes = holes.map(h => h * 25.4);
      }
      finalMinHoleSize = Math.min(...holes);
      // console.log('Calculated Min Hole Size (mm if converted):', finalMinHoleSize);
    }
    result.minHoleSize = finalMinHoleSize;

    // Unit conversion and calculation for trace widths
    let finalMinTraceWidth: number | undefined = undefined;
    if (toolTraceWidthsNative.length > 0) {
      let traces = [...toolTraceWidthsNative]; // Operate on a copy
      // @ts-expect-error: This comparison is logically correct
      if (detectedUnit === 'inch') {
        // console.log(`Converting ${traces.length} potential trace widths from inches to mm.`);
        traces = traces.map(t => t * 25.4);
      }
      finalMinTraceWidth = Math.min(...traces);
      // console.log('Calculated Min Trace Width (mm if converted):', finalMinTraceWidth);
    }

    // console.log('Final Analysis Result:', result);
  } catch (error) {
    result.errors = [error instanceof Error ? error.message : 'Error parsing Gerber with gerber-parser'];
  }

  return { analysis: result, isBoardOutlineInternal };
}

export function mergeAnalysisResults(
  results: Array<{ analysis: GerberAnalysisResult; isBoardOutlineInternal: boolean }>
): GerberAnalysisResult {
  const merged: GerberAnalysisResult = {
    layers: 0, // Will be calculated based on unique copper layers
    fileTypes: results.flatMap(r => r.analysis.fileTypes || []),
    errors: results.flatMap(r => r.analysis.errors || []),
    warnings: results.flatMap(r => r.analysis.warnings || []),
    drillCount: results.reduce((sum, r) => sum + (r.analysis.drillCount || 0), 0),
    hasGoldFingers: results.some(r => r.analysis.hasGoldFingers),
    minTraceWidth: undefined,
    minHoleSize: undefined,
    dimensions: undefined,
  };

  // Calculate actual PCB layers based on all identified copper files
  let copperLayerCount = 0;
  for (const resultItem of results) {
    if (resultItem.analysis.fileTypes) {
      for (const type of resultItem.analysis.fileTypes) {
        if (type.includes('Copper')) {
          copperLayerCount++;
        }
      }
    }
  }
  merged.layers = copperLayerCount;

  // 合并最小线宽
  const traceWidths = results.map(r => r.analysis.minTraceWidth).filter(v => v !== undefined);
  if (traceWidths.length) merged.minTraceWidth = Math.min(...traceWidths);
  // 合并最小孔径
  const holeSizes = results.map(r => r.analysis.minHoleSize).filter(v => v !== undefined);
  if (holeSizes.length) merged.minHoleSize = Math.min(...holeSizes);

  // 合并尺寸（优先使用板框层，否则取最大）
  const outlineLayers = results.filter(r => r.isBoardOutlineInternal && r.analysis.dimensions);
  if (outlineLayers.length > 0) {
    // If multiple outline layers are found, use the first one.
    // Ideally, there should be only one main board outline.
    // A more sophisticated approach might compare them or allow user selection if ambiguous.
    merged.dimensions = outlineLayers[0].analysis.dimensions;
    if (outlineLayers.length > 1) {
      merged.warnings!.push(`Multiple board outline files detected. Using dimensions from '${outlineLayers[0].analysis.fileTypes?.join(', ')}'.`);
      console.warn(`Multiple board outline files detected. Files: ${outlineLayers.map(o => o.analysis.fileTypes?.join('/') ?? 'UnknownFile').join('; ')}. Using dimensions from the first one.`);
    }
    // console.log('Using dimensions from dedicated board outline file:', merged.dimensions);
  } else {
    // Fallback: if no specific outline layer dimensions, take the max of all available dimensions
    const validDimensions = results
      .map(r => r.analysis.dimensions)
      .filter(d => d !== undefined && d.width > 0 && d.height > 0) as { width: number; height: number; unit: 'mm' | 'inch' }[]; // Ensure type after filter

    if (validDimensions.length > 0) {
      merged.dimensions = validDimensions.reduce((acc, cur) => {
        // acc will be the first element in the first call if no initialValue, or the initialValue itself.
        // cur will be the second element onwards.
        return {
          width: Math.max(acc.width, cur.width),
          height: Math.max(acc.height, cur.height),
          unit: 'mm' // Assuming all are converted to mm by this stage
        };
      }); // Uses first element as initial if array not empty, and reduce won't run on empty/single-element array without initialValue
      // console.log('No dedicated board outline found, using max dimensions from all files:', merged.dimensions);
    } else {
      merged.dimensions = undefined; // Explicitly set to undefined if no valid dimensions found
      // console.log('No valid dimensions found in any file to merge.');
    }
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

export async function analyzeFileList(
  fileList: Array<{ name: string; content: string }>,
): Promise<Array<{ analysis: GerberAnalysisResult; isBoardOutlineInternal: boolean }>> {
  const results: Array<{ analysis: GerberAnalysisResult; isBoardOutlineInternal: boolean }> = [];

  for (const file of fileList) {
    try {
      const analysisWithOutlineInfo = await analyzeSingleGerberFile(file.name, file.content);
      results.push(analysisWithOutlineInfo);
    } catch (error) {
      results.push({
        analysis: {
          fileTypes: ['Unknown'],
          errors: [`Failed to analyze ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          layers: 0,
          drillCount: 0,
          hasGoldFingers: false,
          minTraceWidth: undefined,
          minHoleSize: undefined,
          dimensions: undefined,
        },
        isBoardOutlineInternal: false
      });
    }
  }

  return results;
}