// src/components/settings/settings.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Globe2,
  FolderCog,
  Download,
  Waves,
  Film,
  Palette,
  Info,
  Sliders,
  ShieldCheck,
  Network,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  GeneralSettings,
  LanguageSettings,
  DirectorySettings,
  AppearanceSettings,
  AboutSettings,
  NetworkSettings,
} from "./";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function Settings({ isOpen, onClose }: SettingsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("general");

  const tabs = [
    {
      id: "general",
      icon: SettingsIcon,
      label: t("settings.tabs.general"),
      section: "general",
    },
    {
      id: "language",
      icon: Globe2,
      label: t("settings.tabs.language"),
      section: "general",
    },
    {
      id: "appearance",
      icon: Palette,
      label: t("settings.tabs.appearance"),
      section: "general",
    },
    {
      id: "directories",
      icon: FolderCog,
      label: t("settings.tabs.directories"),
      section: "media",
    },
    {
      id: "downloads",
      icon: Download,
      label: t("settings.tabs.downloads"),
      section: "media",
    },
    {
      id: "audio",
      icon: Waves,
      label: t("settings.tabs.audio"),
      section: "media",
    },
    {
      id: "video",
      icon: Film,
      label: t("settings.tabs.video"),
      section: "media",
    },
    {
      id: "network",
      icon: Network,
      label: t("settings.tabs.network"),
      section: "advanced",
    },
    {
      id: "privacy",
      icon: ShieldCheck,
      label: t("settings.tabs.privacy"),
      section: "advanced",
    },
    {
      id: "advanced",
      icon: Sliders,
      label: t("settings.tabs.advanced"),
      section: "advanced",
    },
    {
      id: "about",
      icon: Info,
      label: t("settings.tabs.about"),
      section: "about",
    },
  ];

  const sections = [
    { id: "general", label: t("settings.sections.general") },
    { id: "media", label: t("settings.sections.media") },
    { id: "advanced", label: t("settings.sections.advanced") },
    { id: "about", label: t("settings.sections.about") },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "language":
        return <LanguageSettings />;
      case "directories":
        return <DirectorySettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "about":
        return <AboutSettings />;
      case "network":
        return <NetworkSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0 gap-0">
        <DialogHeader className="h-14 px-6 border-b">
          <DialogTitle className="flex items-center gap-2 py-5">
            <SettingsIcon className="w-5 h-5" />
            {t("settings.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(80vh-3.5rem)]">
          <div className="w-72 border-r">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3 mb-3">
                      {section.label}
                    </h3>
                    <div className="space-y-1">
                      {tabs
                        .filter((tab) => tab.section === section.id)
                        .map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              activeTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                    </div>
                    {section.id !== "about" && (
                      <Separator className="mt-4 opacity-50" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex-1">
            <ScrollArea className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="p-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Settings;