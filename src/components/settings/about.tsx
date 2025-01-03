// src/components/settings/about.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Github,
    Globe,
    MessageCircle,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Heart,
    Bug,
    ArrowUpRightFromCircle,
    Shield,
    BookOpen,
    FileCode2
} from 'lucide-react';
import { invokeCommand } from '../../lib/webview';
import Applogo from "../../assets/app.png";

interface AppInfo {
    version: string;
    buildNumber: string;
    commitHash: string;
    buildDate: string;
    platform: string;
    arch: string;
}

interface UpdateInfo {
    available: boolean;
    version: string;
    notes: string;
    date: string;
}

function AboutSettings() {
    const { t } = useTranslation();
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAppInfo();
        const unsubscribePromise = setupUpdateListener();
        
        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, []);

    const loadAppInfo = async () => {
        try {
            const info = await invokeCommand<AppInfo>('get_app_info');
            setAppInfo(info);
        } catch (error) {
            console.error('Failed to load app info:', error);
        }
    };

    const checkForUpdates = async () => {
        try {
            setIsCheckingUpdate(true);
            setError(null);
            const update = await invokeCommand<UpdateInfo>('check_for_updates');
            setUpdateInfo(update);
        } catch (error) {
            console.error('Failed to check for updates:', error);
            setError(t('about.update.error'));
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const setupUpdateListener = async () => {
        try {
            return await invokeCommand<() => void>('subscribe_to_updates', {
                onUpdateAvailable: (update: UpdateInfo) => {
                    setUpdateInfo(update);
                },
                onUpdateError: (errorMessage: string) => {
                    setError(errorMessage);
                }
            });
        } catch (error) {
            console.error('Failed to setup update listener:', error);
        }
    };

    const openLink = async (url: string) => {
        try {
            await invokeCommand('open_external_link', { url });
        } catch (error) {
            console.error('Failed to open URL:', error);
        }
    };

    const handleUpdateInstall = async () => {
        if (!updateInfo?.available) return;

        try {
            setIsCheckingUpdate(true);
            await invokeCommand('install_update');
        } catch (error) {
            console.error('Failed to install update:', error);
            setError(t('about.update.installError'));
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    if (!appInfo) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header with App Logo */}
            <div className="flex items-center justify-between mb-8 bg-[#2e2e2e] px-4 py-2 border border-[#3e3e3e] rounded-lg">
                <div className='flex items-center space-x-3'>
                    <img
                        src={Applogo}
                        alt="App Logo"
                        className="w-10 h-10"
                    />
                    <div className="-space-y-1">
                        <h1 className="text-lg font-bold text-gray-200">MDU</h1>
                        <p className="text-gray-400 text-sm">Media Downloader Utility</p>
                    </div>
                </div>
                <button
                    onClick={checkForUpdates}
                    disabled={isCheckingUpdate}
                    className="px-4 py-1 rounded-md text-sm text-white disabled:opacity-50 
                             disabled:cursor-not-allowed transition-colors flex items-center 
                             hover:bg-[#3e3e3e]"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    {t('about.update.check')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Version Info Panel */}
                    <div className="bg-[#2d2d2d] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm text-gray-200">
                                    {t('about.app.version')} {appInfo.version}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {t('about.app.build')} {appInfo.buildNumber}
                                </p>
                            </div>
                            {updateInfo?.available && (
                                <button
                                    onClick={handleUpdateInstall}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md
                                             hover:bg-blue-600 transition-colors"
                                >
                                    {t('about.update.install')}
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center px-3 py-2 rounded-md bg-red-500/10 text-red-400 mt-2 text-sm">
                                <XCircle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        )}

                        {updateInfo && (
                            <div className={`flex items-center p-3 rounded-md mt-2 
                                          ${updateInfo.available 
                                              ? 'bg-green-500/10 text-green-400' 
                                              : 'bg-[#3d3d3d] text-gray-300'}`}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {updateInfo.available
                                    ? t('about.update.available', { version: updateInfo.version })
                                    : t('about.update.latest')
                                }
                            </div>
                        )}
                    </div>

                    {/* Platform Info */}
                    <div className="bg-[#2d2d2d] rounded-lg p-4">
                        <h3 className="text-md font-medium text-gray-300 mb-3">
                            {t('about.app.platform')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">{t('about.app.os')}</span>
                                <span className="text-gray-300 text-xs">{appInfo.platform}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">{t('about.app.arch')}</span>
                                <span className="text-gray-300 text-xs">{appInfo.arch}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">{t('about.app.date')}</span>
                                <span className="text-gray-300 text-xs">{appInfo.buildDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Quick Links */}
                    <div className="bg-[#2d2d2d] rounded-lg p-4">
                        <h3 className="text-md font-medium text-gray-300 mb-3">
                            {t('about.links.title')}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo')}
                                className="flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <Github className="w-4 h-4 mr-2" />
                                {t('about.links.github')}
                            </button>
                            <button
                                onClick={() => openLink('https://yourwebsite.com')}
                                className="flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <Globe className="w-4 h-4 mr-2" />
                                {t('about.links.website')}
                            </button>
                        </div>
                    </div>

                    {/* Help & Support */}
                    <div className="bg-[#2d2d2d] rounded-lg p-4">
                        <h3 className="text-md font-medium text-gray-300 mb-3">
                            {t('about.help.title')}
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo/wiki')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                {t('about.help.documentation')}
                            </button>
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo/issues')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <Bug className="w-4 h-4 mr-2" />
                                {t('about.help.report')}
                            </button>
                            <button
                                onClick={() => openLink('https://discord.gg/yourinvite')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {t('about.help.discord')}
                            </button>
                        </div>
                    </div>

                    {/* Legal & Credits */}
                    <div className="bg-[#2d2d2d] rounded-lg p-4">
                        <h3 className="text-md font-medium text-gray-300 mb-3">
                            {t('about.legal.title')}
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo/blob/main/LICENSE')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                {t('about.legal.license')}
                            </button>
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo/blob/main/CREDITS.md')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <Heart className="w-4 h-4 mr-2" />
                                {t('about.legal.credits')}
                            </button>
                            <button
                                onClick={() => openLink('https://github.com/yourusername/yourrepo/blob/main/THIRD-PARTY.md')}
                                className="w-full flex items-center p-3 rounded-md bg-[#3d3d3d] 
                                         hover:bg-[#4d4d4d] text-gray-300 transition-colors text-xs"
                            >
                                <FileCode2 className="w-4 h-4 mr-2" />
                                {t('about.legal.third_party')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-[#2e2e2e] text-center">
                <p className="text-sm text-gray-400">
                    {t('about.footer.made')} <Heart className="w-3 h-3 inline-block mx-1 text-red-400" />
                    {t('about.footer.by')} <button
                        onClick={() => openLink('https://github.com/project-mdu')}
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                    >
                        Project MDU
                        <ArrowUpRightFromCircle className="w-3 h-3 ml-1" />
                    </button>
                </p>
            </div>
        </div>
    );
}

export default AboutSettings;
