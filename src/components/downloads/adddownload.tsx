import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
// import { cn } from "@/lib/utils";
import FormatSelector from "./formatselector";
import { VideoFormat, VideoInfo } from '@/types/video';

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

  // const audioQualityOptions = ["64", "128", "192", "256", "320"];
  // const videoQualityOptions = ["480", "720", "1080", "1440", "2160"];
  // const formatOptions = ["mp4", "mkv", "webm"];

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
      const response = await fetch(`/api/extract?url=${encodeURIComponent(url.trim())}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('API Response:', apiResponse); // For debugging

      // Check if the API response contains the required data
      if (!apiResponse.success || !apiResponse.data || !apiResponse.data.formats) {
        throw new Error(t("downloads.errors.noFormatsFound"));
      }

      const { data } = apiResponse;

      // Create VideoFormat objects from the API response
      const formats: VideoFormat[] = data.formats.map((format: any) => ({
        quality: format.quality || '',
        format: format.format || '',
        size: format.size || 0,
        url: format.url || '',
        mimeType: format.mimeType || '',
        type: format.type || 'video'
      }));

      // Construct the VideoInfo object
      const videoData: VideoInfo = {
        title: data.title || "Untitled",
        description: data.description || "",
        duration: data.duration || 0,
        thumbnail: data.thumbnail || "",
        formats: formats
      };

      if (formats.length === 0) {
        throw new Error(t("downloads.errors.noFormatsFound"));
      }

      setVideoInfo(videoData);

      // Select the first available format by default
      if (formats.length > 0) {
        setSelectedFormat(formats[0].url);
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
        isAudioOnly: selectedVideoFormat.type === "audio",
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

  // const handleOptionChange = (
  //   key: keyof DownloadOptions,
  //   value: string
  // ) => {
  //   setOptions(prev => ({
  //     ...prev,
  //     [key]: value
  //   }));
  // };

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