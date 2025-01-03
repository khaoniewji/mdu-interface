// mdu/src/components/settings/settings.appearance.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Laptop } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
type ViewMode = 'grid' | 'list' | 'compact';
type ThumbnailSize = 'small' | 'medium' | 'large';

interface AppearanceSettings {
  theme: ThemeMode;
  viewMode: ViewMode;
  thumbnailSize: ThumbnailSize;
  showTitles: boolean;
  animateCovers: boolean;
}

const ThemeOptions: { value: ThemeMode; icon: React.ReactNode; labelKey: string }[] = [
  { value: 'light', icon: <Sun className="w-4 h-4" />, labelKey: 'light' },
  { value: 'dark', icon: <Moon className="w-4 h-4" />, labelKey: 'dark' },
  { value: 'system', icon: <Laptop className="w-4 h-4" />, labelKey: 'system' }
];

const ViewModeOptions: { value: ViewMode; labelKey: string }[] = [
  { value: 'grid', labelKey: 'grid' },
  { value: 'list', labelKey: 'list' },
  { value: 'compact', labelKey: 'compact' }
];

const ThumbnailSizeOptions: { value: ThumbnailSize; labelKey: string }[] = [
  { value: 'small', labelKey: 'small' },
  { value: 'medium', labelKey: 'medium' },
  { value: 'large', labelKey: 'large' }
];

function AppearanceSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'system',
    viewMode: 'grid',
    thumbnailSize: 'medium',
    showTitles: true,
    animateCovers: true
  });

  const handleThemeChange = (theme: ThemeMode) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    setSettings(prev => ({ ...prev, viewMode }));
  };

  const handleThumbnailSizeChange = (thumbnailSize: ThumbnailSize) => {
    setSettings(prev => ({ ...prev, thumbnailSize }));
  };

  const handleToggleChange = (key: keyof Pick<AppearanceSettings, 'showTitles' | 'animateCovers'>) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-6">
          {t('settings.appearance.title')}
        </h2>
      </div>

      {/* Theme Section */}
      <div className="space-y-4 text-sm">
        <h3 className="text-md font-medium text-gray-300">
          {t('settings.appearance.theme.title')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {ThemeOptions.map(({ value, icon, labelKey }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex items-center justify-center space-x-2 p-3 rounded-md 
                ${settings.theme === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#2d2d2d] text-gray-300 hover:bg-[#3d3d3d]'}`}
            >
              {icon}
              <span>{t(`settings.appearance.theme.options.${labelKey}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Section */}
      <div className="space-y-4 text-sm">
        <h3 className="text-md font-medium text-gray-300">
          {t('settings.appearance.viewMode.title')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {ViewModeOptions.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => handleViewModeChange(value)}
              className={`p-3 rounded-md 
                ${settings.viewMode === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#2d2d2d] text-gray-300 hover:bg-[#3d3d3d]'}`}
            >
              {t(`settings.appearance.viewMode.options.${labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Thumbnail Size Section */}
      <div className="space-y-4 text-sm">
        <h3 className="text-md font-medium text-gray-300">
          {t('settings.appearance.thumbnailSize.title')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {ThumbnailSizeOptions.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => handleThumbnailSizeChange(value)}
              className={`p-3 rounded-md 
                ${settings.thumbnailSize === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#2d2d2d] text-gray-300 hover:bg-[#3d3d3d]'}`}
            >
              {t(`settings.appearance.thumbnailSize.options.${labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Options Section */}
      <div className="space-y-4 text-sm">
        <h3 className="text-md font-medium text-gray-300">
          {t('settings.appearance.additional.title')}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-md bg-[#2d2d2d]">
            <span className="text-gray-300">{t('settings.appearance.additional.showTitles')}</span>
            <input
              type="checkbox"
              checked={settings.showTitles}
              onChange={() => handleToggleChange('showTitles')}
              className="form-checkbox text-blue-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-md bg-[#2d2d2d]">
            <span className="text-gray-300">{t('settings.appearance.additional.animateCovers')}</span>
            <input
              type="checkbox"
              checked={settings.animateCovers}
              onChange={() => handleToggleChange('animateCovers')}
              className="form-checkbox text-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;