"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  filePath: string; // 完整的Supabase URL或相对路径
  bucket?: string;  // bucket名称，如果filePath是相对路径时使用
  children?: React.ReactNode;
  className?: string;
}

export default function DownloadButton({
  filePath,
  bucket = "next-pcb",
  children = "Download",
  className
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleDownload = async () => {
    setLoading(true);
    
    try {
      // 检查是否是完整的URL
      if (filePath.startsWith('http')) {
        // 如果是完整URL，直接下载
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // 从URL中提取文件名
        const urlParts = filePath.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0] || "download";
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // 如果是相对路径，使用Supabase storage API
        const { data, error } = await supabase.storage.from(bucket).download(filePath);
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = filePath.split("/").pop() || "file";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      size="sm"
      className={className}
    >
      {loading ? "Downloading..." : children}
    </Button>
  );
} 