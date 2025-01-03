// src/components/tour/welcome.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Download,
  Settings,
  FolderOpen,
  Chrome,
  Globe,
  KeyRound,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeTour({ isOpen, onClose }: WelcomeTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      title: t('tour.welcome.title'),
      description: t('tour.welcome.description'),
      icon: <Sparkles className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.downloads.title'),
      description: t('tour.downloads.description'),
      icon: <Download className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.browser.title'),
      description: t('tour.browser.description'),
      icon: <Chrome className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.output.title'),
      description: t('tour.output.description'),
      icon: <FolderOpen className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.settings.title'),
      description: t('tour.settings.description'),
      icon: <Settings className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.proxy.title'),
      description: t('tour.proxy.description'),
      icon: <Globe className="w-12 h-12 text-primary" />,
    },
    {
      title: t('tour.api.title'),
      description: t('tour.api.description'),
      icon: <KeyRound className="w-12 h-12 text-primary" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <Card className="border-0">
          <CardHeader className="text-center pt-6 pb-4">
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mx-auto mb-4 p-2 bg-primary/10 rounded-full">
              {tourSteps[currentStep].icon}
            </div>
            <CardTitle className="text-xl">
              {tourSteps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-sm">
              {currentStep + 1} of {tourSteps.length}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 py-4 text-center">
            <p className="text-muted-foreground">
              {tourSteps[currentStep].description}
            </p>
          </CardContent>

          <CardFooter className="flex justify-between px-6 pb-6">
            <div className="flex space-x-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-6 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                t('tour.finish')
              ) : (
                <>
                  {t('tour.next')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
