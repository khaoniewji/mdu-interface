// src/components/stemextractor/components/settings-panel.tsx
import { Settings2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MODEL_OPTIONS, SPLIT_OPTIONS } from "../../types/stem";
import type { ExtractionSettings } from "./types";

interface SettingsPanelProps {
  settings: ExtractionSettings;
  isProcessing: boolean;
  onSettingChange: (setting: keyof ExtractionSettings, value: any) => void;
}

export function SettingsPanel({
  settings,
  isProcessing,
  onSettingChange,
}: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          {t("stemExtractor.settings.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label className="text-sm font-medium">
            {t("stemExtractor.settings.model")}
          </label>
          <Select
            value={settings.model}
            onValueChange={(value) => onSettingChange("model", value)}
            disabled={isProcessing}
          >
            <SelectTrigger className="w-full bg-background text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="flex items-center justify-between group"
                >
                  <div>
                    <div>{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            {t("stemExtractor.settings.splits")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPLIT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={settings.splits === option.value ? "default" : "outline"}
                className="w-full"
                onClick={() => onSettingChange("splits", option.value)}
                disabled={isProcessing}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}