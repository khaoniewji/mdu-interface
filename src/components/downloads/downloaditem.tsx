// src/components/downloads/DownloadItemComponent.tsx
import { DownloadItem } from "../../types/download";
import { useTranslation } from "react-i18next";

interface DownloadItemComponentProps {
  download: DownloadItem;
}

function DownloadItemX({ download }: DownloadItemComponentProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[#252525] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium">{download.title}</span>
          {download.isAudioOnly && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
              {t("downloads.fileType.audio")}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">{download.fileSize}</span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${download.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {t(`downloads.status.${download.status.toLowerCase()}`)}
        </span>
        <div className="flex items-center space-x-4">
          {download.speed && (
            <span className="text-gray-400">{download.speed}</span>
          )}
          {download.eta && (
            <span className="text-gray-400">
              {t("downloads.info.eta")}: {download.eta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloadItemX;