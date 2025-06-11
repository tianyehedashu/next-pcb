"use client";

import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileUploadStatus } from './FileUploadStatus';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { useForm } from "@formily/react";
import { useQuoteStore } from "@/lib/stores/quote-store";

// 定义一个与FileUploadStatus组件兼容的类型
interface StatusFrontendAnalysisResult {
  dimensions?: {
    width: number; // in mm
    height: number; // in mm
  };
  layers?: number;
  hasGoldFingers?: boolean;
}

// 定义一个与UploadState兼容的接口
interface CompatibleUploadState {
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  uploadStatus: 'idle' | 'selecting' | 'parsing' | 'uploading-supabase' | 'success' | 'error';
  uploadProgress: number;
  uploadError: string | null;
  analysisResult: StatusFrontendAnalysisResult | null;
  uploadUrl: string | null;
  isAnalyzing?: boolean;
}

export function FileUploadSection() {
  const { uploadState, handleFileSelect, retryUpload, clearFile } = useFileUpload();
  const form = useForm();
  const { updateFormData } = useQuoteStore();

  // 处理文件输入变化
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 选择文件后会自动解析并上传
      handleFileSelect(file);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  }, [handleFileSelect]);

  // 处理拖放
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // 拖放文件后会自动解析并上传
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // 处理替换文件
  const handleReplace = useCallback(() => {
    document.getElementById('gerber-upload-replace')?.click();
  }, []);

  // 同步分析结果到表单
  useEffect(() => {
    console.log('=== FileUploadSection useEffect triggered ===');
    console.log('uploadState.analysisResult:', uploadState.analysisResult);
    console.log('uploadState.uploadUrl:', uploadState.uploadUrl);
    console.log('uploadState.uploadStatus:', uploadState.uploadStatus);
    console.log('form:', !!form);
    
    if (!form) {
      console.log('No form instance, skipping sync');
      return;
    }
    
    const fieldsToUpdate: { [key: string]: unknown } = {};

    // 1. 同步分析结果（如果存在）
    if (uploadState.analysisResult) {
      console.log('Syncing analysis result...');
      const { analysisResult } = uploadState;

      // PCB尺寸
      if (analysisResult.dimensions) {
        const { width, height } = analysisResult.dimensions;
        const fixedWidth = typeof width === 'number' ? Number(width.toFixed(2)) : 0;
        const fixedHeight = typeof height === 'number' ? Number(height.toFixed(2)) : 0;
        fieldsToUpdate.singleDimensions = { length: fixedWidth, width: fixedHeight };
        console.log('Setting dimensions:', fieldsToUpdate.singleDimensions);
      }
      
      // 层数
      if (analysisResult.layers && Array.isArray(analysisResult.layers)) {
        fieldsToUpdate.layers = analysisResult.layers.length;
        console.log('Setting layers:', fieldsToUpdate.layers);
      }
      
      // 金手指
      if (analysisResult.hasGoldFingers !== undefined) {
        fieldsToUpdate.goldFingers = analysisResult.hasGoldFingers;
        console.log('Setting goldFingers:', fieldsToUpdate.goldFingers);
      }
    }

    // 2. 同步文件上传URL（最重要的部分）
    if (uploadState.uploadUrl) {
      console.log('Syncing uploadUrl:', uploadState.uploadUrl);
      fieldsToUpdate.gerberUrl = uploadState.uploadUrl;
    }

    // 3. 批量更新 store 和表单
    if (Object.keys(fieldsToUpdate).length > 0) {
      console.log('=== Updating store and form with fields ===', fieldsToUpdate);
      
      // 先更新 store（确保数据持久化）
      updateFormData(fieldsToUpdate);
      console.log('Store updated');
      
      // 再更新表单字段
      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        try {
          if (key === 'singleDimensions' && value && typeof value === 'object') {
            const dims = value as { length: number; width: number };
            form.setFieldState('singleDimensions', state => {
              state.value = {
                length: Number(dims.length) || 0,
                width: Number(dims.width) || 0
              };
            });
            console.log('Form field singleDimensions updated');
          } else {
            form.setFieldState(key, state => {
              if (key === 'layers') {
                state.value = Number(value) || 0;
              } else if (key === 'goldFingers') {
                state.value = Boolean(value);
              } else if (key === 'gerberUrl') {
                state.value = String(value || '');
              } else {
                state.value = value;
              }
            });
            console.log(`Form field ${key} updated to:`, value);
          }
        } catch (error) {
          console.error(`Error updating form field ${key}:`, error);
        }
      });
      
      console.log('=== Sync completed ===');
      console.log('Current form values:', form.values);
      console.log('Current store gerberUrl:', useQuoteStore.getState().formData.gerberUrl);
    } else {
      console.log('No fields to update');
    }
  }, [uploadState.analysisResult, uploadState.uploadUrl, uploadState.uploadStatus, form, updateFormData]);

  const hasFile = !!uploadState.file;

  // 准备FileUploadStatus组件需要的属性
  const uploadStatusProps = {
    uploadState: {
      file: uploadState.file,
      fileName: uploadState.file?.name || null,
      fileSize: uploadState.file?.size || null,
      uploadStatus: uploadState.uploadStatus,
      uploadProgress: uploadState.uploadProgress,
      uploadError: uploadState.uploadError,
      uploadUrl: uploadState.uploadUrl,
      isAnalyzing: uploadState.uploadStatus === 'parsing',
      // 使用兼容的类型处理分析结果
      analysisResult: uploadState.analysisResult 
        ? {
            dimensions: {
              width: uploadState.analysisResult.dimensions?.width || 0,
              height: uploadState.analysisResult.dimensions?.height || 0
            },
            layers: Array.isArray(uploadState.analysisResult.layers) 
              ? uploadState.analysisResult.layers.length 
              : 0,
            hasGoldFingers: uploadState.analysisResult.hasGoldFingers || false
          }
        : null
    } as CompatibleUploadState
  };

  return (
    <div>
      {!hasFile ? (
        // 文件选择区域
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              Drop your Gerber files here
            </h3>
            <p className="text-sm text-gray-500">
              Support .zip, .rar files or individual CAD files
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: All Gerber files (.gbr, .gtl, .gbl, etc.), drill files (.drl, .nc), inner layers (.g1-.g32), reports (.rep, .apr), pick & place (.xy, .pos), BOM files, and more
            </p>
          </div>
          <div className="mt-6">
            <Button 
              type="button" 
              onClick={() => document.getElementById('gerber-upload')?.click()}
              className="inline-flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <input
              type="file"
              accept=".zip,.rar,.gerber,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.gtp,.gbp,.gko,.gml,.drl,.drr,.txt,.nc,.tap,.xln,.ger,.art,.pho,.g1,.g2,.g3,.g4,.g5,.g6,.g7,.g8,.g9,.g10,.g11,.g12,.g13,.g14,.g15,.g16,.g17,.g18,.g19,.g20,.g21,.g22,.g23,.g24,.g25,.g26,.g27,.g28,.g29,.g30,.g31,.g32,.rep,.rul,.ldp,.apr,.extrep,.tx1,.tx2,.tx3,.xy,.pos,.pnp,.bom,.cpl,.route,.mill,.fab,.test,.cmp,.sol,.stc,.sts,.plc,.pls,.crc,.crs,.exc,.drill,.f_cu,.b_cu,.f_mask,.b_mask,.f_silks,.b_silks,.f_paste,.b_paste,.edge_cuts"
              onChange={handleFileInputChange}
              className="hidden"
              id="gerber-upload"
            />
          </div>
        </div>
      ) : (
        // 文件状态显示
        <FileUploadStatus
          uploadState={uploadStatusProps.uploadState}
          onRetry={retryUpload}
          onClear={clearFile}
          onReplace={handleReplace}
        />
      )}

      {/* 分析结果显示 */}
      {uploadState.analysisResult && (
        <AnalysisResultDisplay
          analysisResult={uploadState.analysisResult}
          isAnalyzing={uploadState.uploadStatus === 'parsing'}
        />
      )}

      {/* 隐藏的替换文件input */}
      <input
        type="file"
        accept=".zip,.rar,.gerber,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.gtp,.gbp,.gko,.gml,.drl,.drr,.txt,.nc,.tap,.xln,.ger,.art,.pho,.g1,.g2,.g3,.g4,.g5,.g6,.g7,.g8,.g9,.g10,.g11,.g12,.g13,.g14,.g15,.g16,.g17,.g18,.g19,.g20,.g21,.g22,.g23,.g24,.g25,.g26,.g27,.g28,.g29,.g30,.g31,.g32,.rep,.rul,.ldp,.apr,.extrep,.tx1,.tx2,.tx3,.xy,.pos,.pnp,.bom,.cpl,.route,.mill,.fab,.test,.cmp,.sol,.stc,.sts,.plc,.pls,.crc,.crs,.exc,.drill,.f_cu,.b_cu,.f_mask,.b_mask,.f_silks,.b_silks,.f_paste,.b_paste,.edge_cuts"
        onChange={handleFileInputChange}
        className="hidden"
        id="gerber-upload-replace"
      />
    </div>
  );
} 