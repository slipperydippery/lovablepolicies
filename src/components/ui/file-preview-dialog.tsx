import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { getFileTypeCategory } from "./file-item";

export interface FilePreviewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** File to preview */
  file?: {
    name?: string;
    type?: string;
    url?: string;
    file?: File;
  } | null;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  file,
}) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  // Create object URL for File objects
  React.useEffect(() => {
    if (file?.file && !file.url) {
      const url = URL.createObjectURL(file.file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  const previewUrl = file?.url || objectUrl;
  const fileName = file?.name || file?.file?.name || "File Preview";
  const fileType = file?.type || file?.file?.type;
  const category = getFileTypeCategory(fileType, fileName);

  const renderPreview = () => {
    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <i className="fa-solid fa-file text-6xl mb-4" aria-hidden="true" />
          <p className="text-sm">Preview not available</p>
        </div>
      );
    }

    switch (category) {
      case "image":
        return (
          <img
            src={previewUrl}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        );
      case "video":
        return (
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-[70vh] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-grey-100 dark:bg-grey-800 flex items-center justify-center">
              <i className="fa-solid fa-music text-4xl text-grey-600 dark:text-grey-400" aria-hidden="true" />
            </div>
            <audio src={previewUrl} controls className="w-full max-w-md">
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      case "pdf":
        return (
          <iframe
            src={previewUrl}
            title={fileName}
            className="w-full h-[70vh] rounded-lg border border-grey-300 dark:border-grey-600"
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <i className="fa-solid fa-file text-6xl mb-4" aria-hidden="true" />
            <p className="text-sm">Preview not available for this file type</p>
            <p className="text-xs mt-2">{fileName}</p>
          </div>
        );
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-[90vw] max-w-4xl max-h-[90vh] overflow-auto",
            "bg-card rounded-xl shadow-xl",
            "transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "focus:outline-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-sp-24 py-sp-16 border-b border-border">
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate max-w-[80%]">
              {fileName}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="p-sp-24 flex items-center justify-center min-h-[300px]">
            {renderPreview()}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

FilePreviewDialog.displayName = "FilePreviewDialog";

export { FilePreviewDialog };
