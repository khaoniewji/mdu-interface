// src/components/converter/converter.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FileVideo,
  Plus,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Local Components and Types
import ConverterList from "./converterlists";
import AddConversion from "./addconversion";
import { ConversionItem, ConversionOptions } from "./types";
import { invokeCommand } from "../../lib/webview";

function Converter() {
  const [conversionData, setConversionData] = useState<ConversionItem[]>([]);
  const [activeConversions, setActiveConversions] = useState<ConversionItem[]>([]);
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState<boolean>(false);
  const [showStopAllDialog, setShowStopAllDialog] = useState<boolean>(false);
  
  const { t } = useTranslation();

  useEffect(() => {
    loadConversionHistory();
    const interval = setInterval(loadConversionHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadConversionHistory = async () => {
    try {
      setError(null);
      const history = await invokeCommand<ConversionItem[]>("get_conversion_history");
      const active = history.filter((item) => item.status === "converting");
      const others = history.filter((item) => item.status !== "converting");

      setActiveConversions(active);
      setConversionData(others);
    } catch (error) {
      setError(t("converter.errors.loadFailed"));
      console.error("Failed to load conversion history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConversion = async (
    inputPath: string,
    format: string,
    options: ConversionOptions,
  ) => {
    try {
      await invokeCommand("start_conversion", {
        inputPath,
        format,
        options: {
          ...options,
          outputFormat: format,
        },
      });
      loadConversionHistory();
      setShowConversionModal(false);
    } catch (error) {
      console.error("Failed to start conversion:", error);
      throw error;
    }
  };

  const handleStopConversion = async (conversionId: string) => {
    try {
      await invokeCommand("stop_conversion", { conversionId });
      loadConversionHistory();
    } catch (error) {
      console.error("Failed to stop conversion:", error);
    }
  };

  const handleClearHistory = async () => {
    try {
      await invokeCommand("clear_conversion_history");
      setConversionData([]);
      setShowClearDialog(false);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const handleStopAll = async () => {
    try {
      await invokeCommand("stop_all_conversions");
      await loadConversionHistory();
      setShowStopAllDialog(false);
    } catch (error) {
      console.error("Failed to stop all conversions:", error);
    }
  };

  // Status update subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupStatusListener = async () => {
      try {
        unsubscribe = await invokeCommand("subscribe_to_conversion_updates", {
          callback: (update: ConversionItem) => {
            setActiveConversions(prev => {
              const index = prev.findIndex(item => item.conversionId === update.conversionId);
              if (index === -1 && update.status === "converting") {
                return [...prev, update];
              }
              const newConversions = [...prev];
              if (index !== -1) {
                if (update.status === "converting") {
                  newConversions[index] = update;
                } else {
                  newConversions.splice(index, 1);
                }
              }
              return newConversions;
            });

            if (update.status !== "converting") {
              setConversionData(prev => [update, ...prev]);
            }
          }
        });
      } catch (error) {
        console.error("Failed to setup conversion status listener:", error);
      }
    };

    setupStatusListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <Card className="h-full flex flex-col bg-background border-none rounded-none">
      {/* Header */}
      <CardHeader className="px-4 py-2 space-y-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium">
                {t("converter.title")}
              </CardTitle>
              {activeConversions.length > 0 && (
                <CardDescription className="text-xs">
                  {activeConversions.length} {t("converter.status.active")}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversionModal(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("converter.tooltips.addNew")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeConversions.length === 0}
                  onClick={() => setShowStopAllDialog(true)}
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("converter.tooltips.stopAll")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={conversionData.length === 0}
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t("converter.tooltips.clearHistory")}
              </TooltipContent>
            </Tooltip> */}
          </div>
        </div>
      </CardHeader>

      {/* Main Content */}
      <CardContent className="flex-1 p-4">
        <div className="h-full flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("converter.search.placeholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[calc(100vh-12rem)] flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-4"
                >
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadConversionHistory()}
                  >
                    {t("converter.actions.retry")}
                  </Button>
                </motion.div>
              ) : activeConversions.length === 0 && conversionData.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-4"
                >
                  <div className="p-4 rounded-full bg-muted">
                    <FileVideo className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      {t("converter.status.noConversions")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowConversionModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("converter.actions.addFirst")}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {activeConversions.length > 0 && (
                    <>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                          {t("converter.sections.active")}
                          <Badge variant="secondary" className="rounded-full">
                            {activeConversions.length}
                          </Badge>
                        </h3>
                        <ConverterList
                          conversions={activeConversions}
                          searchQuery={searchQuery}
                          onStopConversion={handleStopConversion}
                        />
                      </div>
                      <Separator className="my-4" />
                    </>
                  )}
                  {conversionData.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">
                        {t("converter.sections.history")}
                      </h3>
                      <ConverterList
                        conversions={conversionData}
                        searchQuery={searchQuery}
                        onStopConversion={handleStopConversion}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Modals */}
      <AddConversion
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        onAddConversion={handleAddConversion}
      />

      {/* Clear History Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("converter.dialogs.clear.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("converter.dialogs.clear.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
            >
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stop All Dialog */}
      <AlertDialog open={showStopAllDialog} onOpenChange={setShowStopAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("converter.dialogs.stopAll.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("converter.dialogs.stopAll.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStopAll}

            >
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default Converter;