// src/components/stemextractor/components/progress-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface ProgressCardProps {
  progress: number;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-background/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}%</span>
            <span>{t("stemExtractor.processing.estimated")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}