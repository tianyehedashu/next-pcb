import React, { useRef } from "react";
import { Button } from "@/components/ui/button";

export interface FileUploadProps {
  label?: string;
  accept?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  buttonText?: string;
  successText?: string;
  placeholder?: string;
  supportedText?: string;
  required?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = "Please upload your PCB Gerber file",
  accept = ".zip,.rar,.7z,.pcb,.gerber",
  value,
  onChange,
  buttonText = "Choose File",
  successText = "✓ File uploaded",
  placeholder = "No file chosen",
  supportedText = "Supported: .zip, .rar, .7z, .pcb, .gerber",
  required = false,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 text-blue-700 font-semibold text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <div className="flex flex-row items-center gap-3 w-full">
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          onChange={e => {
            if (onChange) onChange(e.target.files?.[0] || null);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-[180px]"
        >
          {buttonText}
        </Button>
        {value && (
          <div className="h-10 max-w-[180px] flex items-center justify-center px-4 bg-green-50 border border-green-200 rounded-md gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            <p className="text-sm text-green-700 truncate font-medium">{successText} ({value.name})</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {value ? value.name : placeholder}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{supportedText}</p>
    </div>
  );
};

export default FileUpload; 