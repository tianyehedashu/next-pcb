import * as React from "react";

interface FileUploadProps {
  value?: File;
  onChange?: (file: File | undefined) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept = ".zip,.rar,.7z,.tar,.gz",
  className,
  disabled,
}: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onChange?.(file);
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {value && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
    </div>
  );
} 