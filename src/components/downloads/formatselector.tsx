import React, { useState, useMemo } from 'react';
import { Video, Music, Filter } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uniqBy, orderBy, groupBy } from 'lodash';

interface VideoFormat {
  quality: string;
  format: string;
  mimeType: string;
  type: 'audio' | 'video';
  size: number;
  url: string;
}

interface VideoInfo {
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  formats: VideoFormat[];
}

interface FormatSelectorProps {
  videoInfo: VideoInfo | null;
  selectedFormat: string;
  onFormatSelect: (formatUrl: string) => void;
  formatFileSize: (size: number) => string;
}
const FormatSelector: React.FC<FormatSelectorProps> = ({ 
  videoInfo, 
  selectedFormat, 
  onFormatSelect,
  formatFileSize 
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio'>('all');

  const processedFormats = useMemo(() => {
    if (!videoInfo?.formats) return [];

    // Remove duplicates based on quality, format, and type
    const uniqueFormats = uniqBy(videoInfo.formats, format => 
      `${format.quality}-${format.format}-${format.type}`
    );

    // Sort formats by type, quality (resolution), and size
    return orderBy(uniqueFormats, 
      [
        'type',
        (f) => {
          const match = f.quality.match(/(\d+)p?/);
          return match ? parseInt(match[1], 10) : 0;
        },
        'size'
      ],
      ['asc', 'desc', 'desc']
    );
  }, [videoInfo?.formats]);

  const formatsByType = useMemo(() => 
    groupBy(processedFormats, 'type')
  , [processedFormats]);

  if (!videoInfo?.formats) {
    return null;
  }

  const getFormatUniqueId = (format: VideoFormat): string => {
    const resMatch = format.quality.match(/(\d+)p?(\d*)/);
    const resolution = resMatch ? resMatch[1] : '0';
    const fps = resMatch && resMatch[2] ? resMatch[2] : '';
    return `${resolution}p${fps}-${format.format}-${format.type}`.toLowerCase();
  };

  const getDisplayQuality = (format: VideoFormat): string => {
    if (format.type === 'audio') {
      const quality = format.quality.toLowerCase();
      if (quality.includes('kbps')) return quality;
      return format.quality || 'Audio';
    }
    const resMatch = format.quality.match(/(\d+)p?(\d*)/);
    if (!resMatch) return format.quality;
    
    const resolution = resMatch[1];
    const fps = resMatch[2];
    return fps ? `${resolution}p${fps}` : `${resolution}p`;
  };

  const filteredFormats = selectedType === 'all' 
    ? processedFormats
    : formatsByType[selectedType] || [];

  const handleTypeChange = (type: 'all' | 'video' | 'audio') => {
    setSelectedType(type);
    // If current selected format is not in new type, clear selection
    const formatStillAvailable = filteredFormats.some(
      format => getFormatUniqueId(format) === selectedFormat
    );
    if (!formatStillAvailable) {
      onFormatSelect('');
    }
  };

  const getTypeCount = (type: 'video' | 'audio') => 
    formatsByType[type]?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('all')}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          All ({processedFormats.length})
        </Button>
        <Button
          variant={selectedType === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('video')}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Video ({getTypeCount('video')})
        </Button>
        <Button
          variant={selectedType === 'audio' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('audio')}
          className="flex items-center gap-2"
        >
          <Music className="h-4 w-4" />
          Audio ({getTypeCount('audio')})
        </Button>
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        <RadioGroup
          value={selectedFormat}
          onValueChange={onFormatSelect}
          className="space-y-0 p-1"
        >
          {filteredFormats.map((format) => {
            const formatId = getFormatUniqueId(format);
            const displayQuality = getDisplayQuality(format);
            
            return (
              <div
                key={formatId}
                className={cn(
                  "relative p-2 px-3 flex items-center space-x-3 w-full rounded-lg transition-colors",
                  selectedFormat === formatId
                    ? "bg-secondary"
                    : "hover:bg-secondary/50"
                )}
              >
                <RadioGroupItem
                  value={formatId}
                  id={formatId}
                  className="peer"
                />
                <Label
                  htmlFor={formatId}
                  className="flex items-center w-full justify-between gap-3 cursor-pointer"
                >
                  {format.type === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Music className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{displayQuality}</span>
                      <span className="text-muted-foreground">
                        {formatFileSize(format.size)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{format.format.toUpperCase()}</span>
                      <span>{format.mimeType}</span>
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </ScrollArea>
    </div>
  );
};

export default FormatSelector;