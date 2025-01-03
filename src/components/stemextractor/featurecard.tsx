// src/components/stemextractor/components/feature-card.tsx
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface FeatureCardProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  index: number;
}

export function FeatureCard({
  icon: Icon,
  titleKey,
  descriptionKey,
  index,
}: FeatureCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative space-y-3 bg-background/50 backdrop-blur-sm p-6 rounded-lg">
          <Icon className="h-6 w-6 text-purple-500" />
          <h3 className="font-semibold">{t(titleKey)}</h3>
          <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
        </div>
      </div>
    </motion.div>
  );
}