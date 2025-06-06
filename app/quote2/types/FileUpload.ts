import { FrontendAnalysisResult } from "../components/AnalysisResultDisplay";

// 文件上传状态
export type UploadStatus = 
  | 'idle'               // 初始状态或已重置
  | 'parsing'            // 正在前端解析
  | 'uploading-supabase' // 正在上传到 Supabase
  | 'success'            // 上传成功
  | 'error';             // 上传失败

// 文件上传状态接口
export interface FileUploadState {
  file: File | null;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadUrl: string | null;
  uploadError: string | null;
  analysisResult: FrontendAnalysisResult | null;
}

// Supabase 上传结果接口
export interface SupabaseUploadResult {
  success: boolean;
  url: string | null;
  error: string | null;
}

// 返回给后端的文件上传结果
export interface FileUploadApiResult {
  gerberFileUrl: string | null;
  analysisResult: FrontendAnalysisResult | null;
} 