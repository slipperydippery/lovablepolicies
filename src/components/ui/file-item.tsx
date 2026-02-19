import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface FileItemFile {
  /** The file object or file metadata */
  file?: File;
  /** File name (required if file is not provided) */
  name?: string;
  /** File size in bytes */
  size?: number;
  /** File MIME type */
  type?: string;
  /** URL for download/preview (for already uploaded files) */
  url?: string;
}

export interface FileItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** File data */
  file: FileItemFile;
  /** Display variant */
  variant?: "list";
  /** Show download button */
  showDownload?: boolean;
  /** Disable download button */
  downloadDisabled?: boolean;
  /** Show delete button */
  showDelete?: boolean;
  /** Disable delete button */
  deleteDisabled?: boolean;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when download is clicked */
  onDownload?: () => void;
  /** Callback when file is clicked (for preview) */
  onPreview?: () => void;
}

/** Get file extension from filename */
const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

/** Get file type category from MIME type or extension */
const getFileTypeCategory = (
  mimeType?: string,
  filename?: string
): "image" | "document" | "spreadsheet" | "archive" | "pdf" | "video" | "audio" | "other" => {
  const ext = filename ? getFileExtension(filename) : "";
  
  // Check MIME type first
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z")) return "archive";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
    if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  }
  
  // Fallback to extension
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "wmv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2"];
  const spreadsheetExts = ["xls", "xlsx", "csv", "ods"];
  const documentExts = ["doc", "docx", "odt", "rtf", "txt"];
  
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (archiveExts.includes(ext)) return "archive";
  if (spreadsheetExts.includes(ext)) return "spreadsheet";
  if (documentExts.includes(ext)) return "document";
  
  return "other";
};

/** Get icon for file type */
const getFileIcon = (category: ReturnType<typeof getFileTypeCategory>): string => {
  switch (category) {
    case "image":
      return "fa-solid fa-file-image";
    case "video":
      return "fa-solid fa-file-video";
    case "audio":
      return "fa-solid fa-file-audio";
    case "pdf":
      return "fa-solid fa-file-pdf";
    case "archive":
      return "fa-solid fa-file-zipper";
    case "spreadsheet":
      return "fa-solid fa-file-excel";
    case "document":
      return "fa-solid fa-file-word";
    default:
      return "fa-solid fa-file";
  }
};

/** Format file size */
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0.0MB";
  
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`;
};

/** Generate object URL for file preview */
const useFilePreviewUrl = (file?: File, mimeType?: string) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    
    // Only generate preview for images
    const category = getFileTypeCategory(mimeType, file.name);
    if (category !== "image") {
      setPreviewUrl(null);
      return;
    }
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, mimeType]);
  
  return previewUrl;
};

const FileItem = React.forwardRef<HTMLDivElement, FileItemProps>(
  (
    {
      className,
      file,
      variant = "list",
      showDownload = true,
      downloadDisabled = false,
      showDelete = true,
      deleteDisabled = false,
      onDelete,
      onDownload,
      onPreview,
      ...props
    },
    ref
  ) => {
    const fileName = file.name || file.file?.name || "Untitled";
    const fileSize = file.size ?? file.file?.size;
    const fileType = file.type || file.file?.type;
    const category = getFileTypeCategory(fileType, fileName);
    const iconClass = getFileIcon(category);
    const previewUrl = useFilePreviewUrl(file.file, fileType);

    const handleClick = (e: React.MouseEvent) => {
      // Don't trigger preview if clicking on action buttons
      if ((e.target as HTMLElement).closest("button")) return;
      onPreview?.();
    };

    const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!downloadDisabled) {
        onDownload?.();
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!deleteDisabled) {
        onDelete?.();
      }
    };

    // List variant - compact row with stacked info and actions
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-sp-12 px-sp-16 py-sp-8 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-900 cursor-pointer hover:border-grey-300 dark:hover:border-grey-600 transition-colors",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* File Type Icon */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          <i
            className={cn(iconClass, "text-grey-400 dark:text-grey-500 text-2xl")}
            aria-hidden="true"
          />
        </div>

        {/* File Info - stacked name and size */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {fileName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-sp-4 shrink-0">
          {showDownload && (
            <Button
              type="button"
              variant="ghost"
              square
              onClick={handleDownload}
              disabled={downloadDisabled}
              aria-label="Download file"
            >
              <i className="fa-solid fa-download" aria-hidden="true" />
            </Button>
          )}
          {showDelete && (
            <Button
              type="button"
              variant="ghost"
              colorScheme="error"
              square
              onClick={handleDelete}
              disabled={deleteDisabled}
              aria-label="Delete file"
            >
              <i className="fa-solid fa-trash" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

FileItem.displayName = "FileItem";

export { FileItem, getFileTypeCategory, getFileIcon, formatFileSize };
