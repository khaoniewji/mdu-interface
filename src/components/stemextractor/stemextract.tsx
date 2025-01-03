// src/components/stemextractor/stemextract.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileAudio, AudioWaveform } from "lucide-react";
import { motion } from "framer-motion";
import { UploadZone } from "./uploadzone";
import { PreviewCard } from "./previewcard";
import { SettingsPanel } from "./settingspanel";
import { ProgressCard } from "./progresscard";
import type { ExtractionSettings, StemExtractionResult } from "./types";

interface StemExtractorProps {
  onExtract?: (result: StemExtractionResult) => void;
}

export default function StemExtractor({ onExtract }: StemExtractorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [settings, setSettings] = React.useState<ExtractionSettings>({
    model: "htdemucs",
    segments: "default",
    shifts: 0,
    splits: "4stems",
    overlap: "4",
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("audio/")) {
        setFile(selectedFile);
      } else {
        toast({
          variant: "destructive",
          title: t("stemExtractor.error.invalidFile"),
          description: t("stemExtractor.error.audioOnly"),
        });
      }
    }
  };

  const handleSettingChange = (
    setting: keyof ExtractionSettings,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate processing with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProgress(i);
      }

      // TODO: Implement actual stem extraction logic here
      const result: StemExtractionResult = {
        vocals: "path/to/vocals.wav",
        drums: "path/to/drums.wav",
        bass: "path/to/bass.wav",
        other: "path/to/other.wav",
      };

      onExtract?.(result);

      toast({
        title: t("stemExtractor.success.title"),
        description: t("stemExtractor.success.description"),
      });
    } catch (error) {
      console.error("Extraction error:", error);
      toast({
        variant: "destructive",
        title: t("stemExtractor.error.title"),
        description: t("stemExtractor.error.description"),
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-5xl mx-auto pt-8 px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
              <AudioWaveform className="w-10 h-10 text-purple-500" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">
            {t("stemExtractor.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("stemExtractor.description")}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-[1fr,300px]">
          {/* Left Column */}
          <div className="space-y-6">
            <UploadZone
              file={file}
              isProcessing={isProcessing}
              onFileSelect={handleFileSelect}
            />
            {file && <PreviewCard file={file} />}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SettingsPanel
              settings={settings}
              isProcessing={isProcessing}
              onSettingChange={handleSettingChange}
            />

            <Button
              onClick={handleExtract}
              disabled={!file || isProcessing}
              className="w-full h-12 text-base"
              variant={isProcessing ? "outline" : "default"}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("stemExtractor.processing.status", { progress })}
                </div>
              ) : (
                <>
                  <FileAudio className="mr-2 h-5 w-5" />
                  {t("stemExtractor.extract")}
                </>
              )}
            </Button>

            {isProcessing && <ProgressCard progress={progress} />}
          </div>
        </div>
      </div>
    </div>
  );
}