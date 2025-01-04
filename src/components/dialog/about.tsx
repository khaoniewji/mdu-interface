// src/components/dialog/about.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Github, Twitter, Heart, Coffee } from 'lucide-react';
import AppIcon from '../../assets/app.png';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const { t } = useTranslation();
  const [version] = useState('1.0.0'); // You can fetch this from your app config

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img 
              src={AppIcon} 
              alt="App Logo" 
              className="w-24 h-24 rounded-xl shadow-lg"
            />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Media Downloader Utility
          </DialogTitle>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-muted-foreground">
              {t('about.description')}
            </p>
            <Badge variant="secondary" className="mx-auto">
              v{version}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="mt-4 h-[200px] pr-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t('about.features.title')}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('about.features.multiPlatform')}</li>
                <li>• {t('about.features.formats')}</li>
                <li>• {t('about.features.download')}</li>
                <li>• {t('about.features.browser')}</li>
                <li>• {t('about.features.proxy')}</li>
                <li>• {t('about.features.batch')}</li>
                <li>• {t('about.features.extract')}</li>
                <li>• {t('about.features.convert')}</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t('about.credits')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('about.credits.description')}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">
                  {t('about.credits.madeWith')}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t('about.links')}
              </h4>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => openLink('https://github.com/yourusername/project')}
                >
                  <Github className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => openLink('https://twitter.com/yourusername')}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => openLink('https://yourwebsite.com')}
                >
                  <Globe className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => openLink('https://ko-fi.com/yourusername')}
                >
                  <Coffee className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MDU
          </div>
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}