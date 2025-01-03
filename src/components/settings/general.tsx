
import { useTranslation } from "react-i18next";
import Switch from "../ui/switch";

function GeneralSettings() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-200 mb-6">
        {t("settings.general.title")}
      </h2>

      <div className="space-y-6">
        {/* Startup Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            {t("settings.general.startup.title")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200">
                  {t("settings.general.startup.launchAtStartup")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("settings.general.startup.launchAtStartupDescription")}
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200">
                  {t("settings.general.startup.minimizeToTray")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("settings.general.startup.minimizeToTrayDescription")}
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Updates Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            {t("settings.general.updates.title")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200">
                  {t("settings.general.updates.autoUpdate")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("settings.general.updates.autoUpdateDescription")}
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Performance Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            {t("settings.general.performance.title")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200">
                  {t("settings.general.performance.hardwareAcceleration")}
                </p>
                <p className="text-xs text-gray-400">
                  {t(
                    "settings.general.performance.hardwareAccelerationDescription",
                  )}
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GeneralSettings;
