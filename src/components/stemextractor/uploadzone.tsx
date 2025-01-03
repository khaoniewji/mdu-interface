// src/components/stemextractor/components/upload-zone.tsx
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface UploadZoneProps {
  file: File | null;
  isProcessing: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadZone({
  file,
  isProcessing,
  onFileSelect,
}: UploadZoneProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Input
        id="audio-file"
        type="file"
        accept="audio/*"
        onChange={onFileSelect}
        disabled={isProcessing}
        className="hidden"
      />
      <label
        htmlFor="audio-file"
        className="group relative block aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="rounded-full bg-background p-4 shadow-sm transition-transform group-hover:scale-110">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            {file ? file.name : t("stemExtractor.dropzone.placeholder")}
          </p>
        </div>
      </label>
    </div>
  );
}