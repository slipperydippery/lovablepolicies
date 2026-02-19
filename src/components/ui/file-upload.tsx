import * as React from "react";
import { cn } from "@/lib/utils";
import { FileItem, FileItemFile } from "./file-item";
import { FilePreviewDialog } from "./file-preview-dialog";

export interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current file(s) */
  value?: File | File[] | null;
  /** Callback when files are selected */
  onChange?: (files: File | File[] | null) => void;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Accepted file types (MIME types or extensions) */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Enable/disable dropzone */
  dropzone?: boolean;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Name attribute for the input */
  name?: string;
  /** Layout for displaying uploaded files */
  filesLayout?: "list" | "none";
  /** Show download button on file items */
  showDownload?: boolean;
  /** Disable download button */
  downloadDisabled?: boolean;
  /** Disable delete button */
  deleteDisabled?: boolean;
  /** Callback when download is clicked */
  onDownload?: (file: File, index: number) => void;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      value,
      onChange,
      multiple = false,
      accept = "*",
      maxSize,
      dropzone = true,
      description,
      icon,
      disabled = false,
      name,
      filesLayout = "none",
      showDownload = true,
      downloadDisabled = false,
      deleteDisabled = false,
      onDownload,
      ...props
    },
    ref
  ) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [previewFile, setPreviewFile] = React.useState<FileItemFile | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Normalize value to array for internal use
    const files = React.useMemo(() => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }, [value]);

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      if (multiple) {
        const newFiles = [...files, ...Array.from(selectedFiles)];
        onChange?.(newFiles);
      } else {
        onChange?.(selectedFiles[0]);
      }

      // Reset input value to allow re-selecting the same file
      e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && dropzone) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled || !dropzone) return;

      const droppedFiles = e.dataTransfer.files;
      if (!droppedFiles || droppedFiles.length === 0) return;

      if (multiple) {
        const newFiles = [...files, ...Array.from(droppedFiles)];
        onChange?.(newFiles);
      } else {
        onChange?.(droppedFiles[0]);
      }
    };

    const handleDelete = (index: number) => {
      if (multiple) {
        const newFiles = files.filter((_, i) => i !== index);
        onChange?.(newFiles.length > 0 ? newFiles : null);
      } else {
        onChange?.(null);
      }
    };

    const handleDownload = (file: File, index: number) => {
      if (onDownload) {
        onDownload(file, index);
      } else {
        // Default download behavior
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    const handlePreview = (file: File) => {
      setPreviewFile({ file, name: file.name, type: file.type, size: file.size });
    };

    const defaultIcon = (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-grey-800 dark:bg-grey-700 text-white">
        <i className="fa-solid fa-cloud-arrow-up text-xl" aria-hidden="true" />
      </div>
    );

    const hasFiles = files.length > 0;

    return (
      <>
        <div className={cn("flex flex-col gap-sp-8", filesLayout === "list" && "gap-sp-12")}>
          {/* Upload Area */}
          <div
            ref={ref}
            className={cn(
              // Base styles
              "relative flex flex-col items-center justify-center gap-sp-8 rounded-lg p-sp-32 text-center transition-all cursor-pointer",
              "border-2 border-dashed",
              // Default state
              "border-grey-300 dark:border-grey-400 bg-white dark:bg-grey-900",
              // Focus state
              "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              // Drag-over state
              isDragOver && "border-primary bg-primary/5 dark:bg-primary/10",
              // Disabled state
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            aria-disabled={disabled}
            {...props}
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={accept}
              multiple={multiple}
              onChange={handleChange}
              disabled={disabled}
              name={name}
            />

            {/* Icon */}
            {icon || defaultIcon}

            {/* Label */}
            <p className="text-sm">
              <span className="text-primary font-medium">Upload</span>{" "}
              <span className="text-muted-foreground">or drag a file here</span>
            </p>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}

          </div>

          {/* List Files (outside uploader) */}
          {filesLayout === "list" && hasFiles && (
            <div className="flex flex-col gap-sp-8">
              {files.map((file, index) => (
                <FileItem
                  key={`${file.name}-${index}`}
                  file={{ file, name: file.name, type: file.type, size: file.size }}
                  variant="list"
                  showDownload={showDownload}
                  downloadDisabled={downloadDisabled}
                  showDelete
                  deleteDisabled={deleteDisabled}
                  onDelete={() => handleDelete(index)}
                  onDownload={() => handleDownload(file, index)}
                  onPreview={() => handlePreview(file)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <FilePreviewDialog
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          file={previewFile}
        />
      </>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
