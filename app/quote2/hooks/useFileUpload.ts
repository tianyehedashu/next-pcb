import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FrontendAnalysisResult } from "../components/AnalysisResultDisplay";
import { SupabaseUploadResult, FileUploadState } from '../types/FileUpload';
import { useUserStore } from '@/lib/userStore';
import JSZip from 'jszip';
import whatsThatGerber from 'whats-that-gerber';
import gerberParser from 'gerber-parser';

const initialState: FileUploadState = {
  file: null,
  uploadStatus: 'idle',
  uploadProgress: 0,
  uploadError: null,
  analysisResult: null,
  uploadUrl: null
};

// --- Start Refactored Analysis Logic (inspired by backend) ---

/**
 * Analyzes a single file's content to extract Gerber data.
 * Mimics the core logic of the backend's `analyzeSingleGerberFile`.
 */
async function analyzeSingleFile(name: string, content: string): Promise<{ analysis: FrontendAnalysisResult; isBoardOutline: boolean }> {
  const analysis: FrontendAnalysisResult = {
    layers: [],
    hasGoldFingers: /goldfinger/i.test(name),
  };
  let isBoardOutline = false;

  // 1. Identify file type with whats-that-gerber
        try {
          const wtgResult = whatsThatGerber([name]);
          const fileTypeInfo = wtgResult[name];
          if (fileTypeInfo && fileTypeInfo.type) {
      let typeString = '';
            if (fileTypeInfo.side) {
              const side = fileTypeInfo.side.charAt(0).toUpperCase() + fileTypeInfo.side.slice(1);
              const type = fileTypeInfo.type.charAt(0).toUpperCase() + fileTypeInfo.type.slice(1);
        typeString = (type === 'Drill' || type === 'Outline') ? type : `${side} ${type}`;
              } else {
        typeString = fileTypeInfo.type.charAt(0).toUpperCase() + fileTypeInfo.type.slice(1);
      }
      if (fileTypeInfo.type === 'outline') {
        isBoardOutline = true;
      }
      analysis.layers!.push(typeString);
    }
  } catch {
    // Ignore whats-that-gerber errors
  }

  // 2. Parse with gerber-parser to get dimensions and technical specs
  try {
    const parser = gerberParser({});
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let detectedUnit = 'mm';
    const currentHoleSizes: number[] = [];
    const toolTraceWidths: number[] = [];

    parser.on('data', (data: unknown) => {
      const d = data as { type?: string; prop?: string; value?: string; coord?: { x?: number; y?: number }; tool?: { diameter?: number; shape?: string; params?: number[] } };
      // 单位
      if (d.type === 'set' && d.prop === 'units') {
        detectedUnit = d.value || detectedUnit;
      }
      // 坐标
      if (d.type === 'op') {
        if (d.coord?.x !== undefined && d.coord?.y !== undefined) {
          minX = Math.min(minX, d.coord.x);
          minY = Math.min(minY, d.coord.y);
          maxX = Math.max(maxX, d.coord.x);
          maxY = Math.max(maxY, d.coord.y);
        }
      }
      // tool
      if (d.type === 'tool' && d.tool) {
        if (d.tool.diameter) currentHoleSizes.push(d.tool.diameter);
        const { shape, params } = d.tool;
        if (shape === 'circle' && params && params.length >= 1) {
          toolTraceWidths.push(params[0]);
        } else if ((shape === 'rect' || shape === 'obround') && params && params.length >= 2) {
          toolTraceWidths.push(Math.min(params[0], params[1]));
        }
        // 其它shape忽略
      }
    });
    parser.write(content);
    parser.end();
    
    // Process collected data
    if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY) && maxX > minX && maxY > minY) {
      let width = maxX - minX;
      let height = maxY - minY;
      if (detectedUnit === 'in') {
        width *= 25.4;
        height *= 25.4;
      }
      analysis.dimensions = { width, height };
    }

    const toMm = (val: number) => (detectedUnit === 'in' ? val * 25.4 : val);
    if (currentHoleSizes.length > 0) {
      analysis.minHoleSize = Math.min(...currentHoleSizes.map(toMm));
    }
    if (toolTraceWidths.length > 0) {
      analysis.minTraceWidth = Math.min(...toolTraceWidths.map(toMm));
    }
  } catch {
    // Ignore gerber-parser errors
  }

  return { analysis, isBoardOutline };
}

/**
 * Merges analysis results from multiple files into a single result.
 * Mimics the backend's `mergeAnalysisResults`.
 */
function mergeAnalysisResults(results: Array<{ analysis: FrontendAnalysisResult; isBoardOutline: boolean }>): FrontendAnalysisResult {
  const merged: FrontendAnalysisResult = {
    layers: [],
    hasGoldFingers: results.some(r => r.analysis.hasGoldFingers),
  };

  // 层数统计：所有文件类型中包含Copper的数量（不去重）
  const allFileTypes = results.flatMap(r => r.analysis.layers || []);
  merged.layers = allFileTypes.filter(type => type.toLowerCase().includes('copper'));

  // Merge technical specs (min of all files)
  const allTraceWidths = results.map(r => r.analysis.minTraceWidth).filter(Boolean) as number[];
  if (allTraceWidths.length > 0) merged.minTraceWidth = Math.min(...allTraceWidths);
  
  const allHoleSizes = results.map(r => r.analysis.minHoleSize).filter(Boolean) as number[];
  if (allHoleSizes.length > 0) merged.minHoleSize = Math.min(...allHoleSizes);

  // Merge dimensions: 优先用outline，无outline时分别取最大width和最大height
  const outlineLayers = results.filter(r => r.isBoardOutline && r.analysis.dimensions);
  if (outlineLayers.length > 0) {
    merged.dimensions = outlineLayers[0].analysis.dimensions;
  } else {
    const validDimensions = results.map(r => r.analysis.dimensions).filter(Boolean) as { width: number, height: number }[];
    if (validDimensions.length > 0) {
      const maxWidth = Math.max(...validDimensions.map(d => d.width));
      const maxHeight = Math.max(...validDimensions.map(d => d.height));
      merged.dimensions = { width: maxWidth, height: maxHeight };
    }
  }

  return merged;
}

/**
 * Main analysis orchestrator for a zip or single file.
 */
async function analyzeGerberPackage(file: File): Promise<FrontendAnalysisResult> {
  const fileList: Array<{ name: string; content: string }> = [];
  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    for (const [filename, fileData] of Object.entries(zip.files)) {
      if (!fileData.dir) {
        fileList.push({ name: filename, content: await fileData.async('text') });
      }
    }
  } else {
    fileList.push({ name: file.name, content: await file.text() });
  }

  if (fileList.length === 0) throw new Error('No valid files found in the archive.');

  const analysisPromises = fileList.map(({ name, content }) => analyzeSingleFile(name, content));
  const individualResults = await Promise.all(analysisPromises);
  
  return mergeAnalysisResults(individualResults);
}

// --- End Refactored Analysis Logic ---


// 工具函数：上传文件到Supabase
async function uploadFileToSupabase(file: File, user: any): Promise<SupabaseUploadResult> {
    // 生成UUID并保留原始文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const uuid = `${timestamp}-${randomStr}`;
    const originalName = file.name;
    
    // 添加用户信息到文件路径
    let userFolder = 'guest';
    if (user) {
      if (user.email) {
        userFolder = user.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      } else if (user.id) {
        userFolder = `user_${user.id}`;
      }
    }
  const filePath = `gerber_uploads/${userFolder}/${uuid}-${originalName}`;
    const bucketName = 'gerber';

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        });
      if (error) {
        return { success: false, url: null, error: error.message };
      }
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      if (!publicUrlData || !publicUrlData.publicUrl) {
      return { success: false, url: null, error: 'Failed to get public URL after upload.' };
    }
    return { success: true, url: publicUrlData.publicUrl, error: null };
  } catch (error: any) {
    return { success: false, url: null, error: error?.message || 'Unknown error during upload' };
  }
}

// 主hook
export function useFileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>(initialState);
  const user = useUserStore(state => state.user);

  // 选择文件并自动分析+上传
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadState({ ...initialState, file, uploadStatus: 'parsing' });
    let analysisResult: FrontendAnalysisResult | null = null;
    try {
      // 1. 前端分析
      analysisResult = await analyzeGerberPackage(file);
      setUploadState(prev => ({ ...prev, analysisResult, uploadStatus: 'idle' }));
    } catch (error: any) {
      // 分析失败，记录错误
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadError: error?.message || 'Unknown error during analysis',
        analysisResult: null,
      }));
    }
    // 2. 未登录只分析
    if (!user) {
      if (analysisResult) { // if analysis was successful
        setUploadState(prev => ({
          ...prev,
          uploadStatus: 'idle',
          uploadError: 'Please log in to upload files to the cloud.',
          uploadUrl: null,
        }));
      }
      return;
    }
    // 3. 登录后自动上传（无论分析是否成功）
    setUploadState(prev => ({ ...prev, uploadStatus: 'uploading-supabase', uploadError: null }));
    const uploadResult = await uploadFileToSupabase(file, user);
    if (uploadResult.success) {
      setUploadState(prev => ({ ...prev, uploadStatus: 'success', uploadUrl: uploadResult.url, uploadError: null, uploadProgress: 100, analysisResult: analysisResult || prev.analysisResult }));
    } else {
      setUploadState(prev => ({ ...prev, uploadStatus: 'error', uploadError: uploadResult.error, uploadProgress: 100, analysisResult: analysisResult || prev.analysisResult }));
    }
  }, [user]);

  // 重试逻辑
  const retryUpload = useCallback(async () => {
    if (!uploadState.file) return;

    // If analysis failed, retry the whole process.
    if (!uploadState.analysisResult && uploadState.uploadError?.includes('analysis')) {
        await handleFileSelect(uploadState.file);
        return;
    }
    
    // If upload failed, retry only the upload.
    if (uploadState.file) {
      setUploadState(prev => ({ ...prev, uploadStatus: 'uploading-supabase', uploadError: null }));
      const uploadResult = await uploadFileToSupabase(uploadState.file, user);
      if (uploadResult.success) {
        setUploadState(prev => ({ ...prev, uploadStatus: 'success', uploadUrl: uploadResult.url, uploadError: null, uploadProgress: 100 }));
        } else {
        setUploadState(prev => ({ ...prev, uploadStatus: 'error', uploadError: uploadResult.error, uploadProgress: 100 }));
      }
    }
  }, [uploadState, user, handleFileSelect]);

  // 清空
  const clearFile = useCallback(() => {
    setUploadState(initialState);
  }, []);

  // 兼容外部调用
  const initiateUpload = useCallback(async (file: File) => {
    if (!file) return { success: false, error: "No file selected.", analysisResult: null };
    try {
      await handleFileSelect(file);
      // Note: uploadState might not be updated immediately after handleFileSelect.
      // This function's return value may not be reliable for the immediate result.
      return { 
        success: true, 
        analysisResult: uploadState.analysisResult,
        error: null
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.message || "Unknown error",
        analysisResult: null 
      };
    }
  }, [handleFileSelect, uploadState.analysisResult]);

  return {
    uploadState,
    handleFileSelect,
    retryUpload,
    clearFile,
    initiateUpload,
  };
} 