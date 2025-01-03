// src/components/stemextractor/components/preview-card.tsx
import { PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PreviewCardProps {
  file: File;
}

export function PreviewCard({ file }: PreviewCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden bg-background/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-purple-500" />
            {t("stemExtractor.preview.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Waveform Visualization */}
            <div className="h-32 bg-muted rounded-md flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("stemExtractor.preview.waveform")}
              </p>
            </div>
            
            {/* File Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t("stemExtractor.fileInfo.size")}:
                </span>{" "}
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("stemExtractor.fileInfo.type")}:
                </span>{" "}
                {file.type}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}