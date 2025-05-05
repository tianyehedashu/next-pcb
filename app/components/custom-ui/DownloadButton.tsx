"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DownloadButtonProps {
  filePath: string; // 文件名或带子目录的路径
  bucket?: string;  // 默认 next-pcb
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

  const handleDownload = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    setLoading(false);

    if (error) {
      alert("Download failed: " + error.message);
      return;
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