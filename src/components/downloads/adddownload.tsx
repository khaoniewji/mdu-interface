import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
// import { cn } from "@/lib/utils";
import FormatSelector from "./formatselector";

interface VideoFormat {
  quality: string;
  format: string;
  size: number;
  url: string;
  mimeType: string;
  type: string;
}

interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  formats: VideoFormat[];
}

export interface DownloadOptions {
  outputPath?: string;
  isAudioOnly?: boolean;
  filename?: string;
  audioQuality: string;
  videoQuality: string;
  format: string;
}

interface AddDownloadProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDownload: (url: string, format: VideoFormat, options: DownloadOptions) => Promise<void>;
}



function AddDownload({ isOpen, onClose, onAddDownload }: AddDownloadProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [options, setOptions] = useState<DownloadOptions>({
    audioQuality: "192",
    videoQuality: "1080",
    format: "mp4",
  });

  const audioQualityOptions = ["64", "128", "192", "256", "320"];
  const videoQualityOptions = ["480", "720", "1080", "1440", "2160"];
  const formatOptions = ["mp4", "mkv", "webm"];

  const resetState = () => {
    setUrl("");
    setError(null);
    setVideoInfo(null);
    setSelectedFormat("");
    setIsLoading(false);
    setOptions({
      audioQuality: "192",
      videoQuality: "1080",
      format: "mp4",
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
    setVideoInfo(null);
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError(t("downloads.errors.emptyUrl"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      // Using the proxy path instead of the full URL
      const response = await fetch(`/api/extract?url=${encodeURIComponent(url.trim())}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const videoData: VideoInfo = await response.json();

      if (!videoData || !videoData.formats || videoData.formats.length === 0) {
        throw new Error(t("downloads.errors.noFormatsFound"));
      }

      setVideoInfo(videoData);

      // Select the highest quality format by default
      const bestFormat = videoData.formats.find(f =>
        f.quality.includes("1080") || f.quality.includes("720")
      );

      if (bestFormat) {
        setSelectedFormat(bestFormat.url);
      }

    } catch (err) {
      console.error("Video info extraction error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!videoInfo || !selectedFormat) return;

    try {
      const selectedVideoFormat = videoInfo.formats.find(f => f.url === selectedFormat);
      if (!selectedVideoFormat) {
        throw new Error("Selected format not found");
      }

      await onAddDownload(url, selectedVideoFormat, {
        ...options,
        isAudioOnly: selectedVideoFormat.format === "audio",
        filename: videoInfo.title
      });
      handleClose();
    } catch (err) {
      console.error("Download error:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleOptionChange = (
    key: keyof DownloadOptions,
    value: string
  ) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };


  const renderOptions = () => (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">
        {t("downloads.addModal.downloadOptions")}
      </Label>
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            key: "audioQuality" as const,
            label: t("downloads.addModal.audioQuality"),
            options: audioQualityOptions,
            value: options.audioQuality,
            format: (opt: string) => `${opt} kbps`,
          },
          {
            key: "videoQuality" as const,
            label: t("downloads.addModal.videoQuality"),
            options: videoQualityOptions,
            value: options.videoQuality,
            format: (opt: string) => `${opt}p`,
          },
          {
            key: "format" as const,
            label: t("downloads.addModal.format"),
            options: formatOptions,
            value: options.format,
            format: (opt: string) => opt.toUpperCase(),
          },
        ].map((setting) => (
          <div key={setting.key} className="space-y-2">
            <Label>{setting.label}</Label>
            <Select
              value={setting.value}
              onValueChange={(value) =>
                handleOptionChange(setting.key, value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {setting.format(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t("downloads.addModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={handleUrlChange}
              placeholder={t("downloads.addModal.urlPlaceholder")}
              className="flex-1"
            />
            <Button onClick={fetchVideoInfo} disabled={isLoading || !url.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? t("common.loading") : t("downloads.addModal.fetch")}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : videoInfo && (
            <div className="space-y-2">
              <Card>
                <CardContent className="flex gap-4 p-4">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-40 h-24 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium line-clamp-2">{videoInfo.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{videoInfo.description}</p>
                    {videoInfo.duration && (
                        <p className="text-sm text-muted-foreground">
                        {Math.floor(videoInfo.duration / 3600)}:
                        {Math.floor((videoInfo.duration % 3600) / 60).toString().padStart(2, "0")}:
                        {(videoInfo.duration % 60).toString().padStart(2, "0")}
                        </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* {renderOptions()} */}

              <div className="space-y-0">
                <Label>{t("downloads.addModal.selectFormat")}</Label>
                <FormatSelector
                  videoInfo={videoInfo}
                  selectedFormat={selectedFormat}
                  onFormatSelect={setSelectedFormat}
                  formatFileSize={formatFileSize}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!videoInfo || !selectedFormat || isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {t("downloads.addModal.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddDownload;