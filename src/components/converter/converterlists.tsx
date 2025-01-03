// src/components/converter/converterlists.tsx
import { motion } from "framer-motion";
import { StopCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ConversionItem } from "./types";

interface ConverterListProps {
  conversions: ConversionItem[];
  searchQuery: string;
  onStopConversion: (id: string) => void;
}

import { LucideIcon } from "lucide-react";

const StatusIcon: Record<string, LucideIcon> = {
  'converting': Clock,
  'completed': CheckCircle,
  'failed': XCircle,
  'stopped': StopCircle,
};

const StatusColor: Record<string, string> = {
  'converting': "text-blue-500",
  'completed': "text-green-500",
  'failed': "text-red-500",
  'stopped': "text-yellow-500",
};

function ConverterList({
  conversions,
  searchQuery,
  onStopConversion,
}: ConverterListProps) {
  const filteredConversions = conversions.filter((conversion) =>
    conversion.inputPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {filteredConversions.map((conversion) => {
        const Icon = StatusIcon[conversion.status];
        const statusColor = StatusColor[conversion.status];

        return (
          <motion.div
            key={conversion.conversionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${statusColor}`} />
                  <h4 className="text-sm font-medium truncate">
                    {conversion.fileName}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {conversion.format}
                  </Badge>
                </div>
                {conversion.status === 'converting' && (
                  <div className="space-y-2">
                    <Progress value={conversion.progress} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      {conversion.progress}% - {conversion.eta || 'Calculating...'}
                    </p>
                  </div>
                )}
              </div>
              {conversion.status === 'converting' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStopConversion(conversion.conversionId)}
                    >
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop conversion</TooltipContent>
                </Tooltip>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ConverterList;