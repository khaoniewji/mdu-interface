// src/components/windowed/header.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Download,
    FileOutput,
    Music2,
    Settings as SettingsIcon,
    Heart,
} from 'lucide-react';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from '../settings';
import { AboutDialog } from '../dialog/about';
import { createMenuItems, MenuItem, MenuGroup } from '../../constants/menuitems';

function MenuBar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const menuItems = createMenuItems(t);
    const [showAbout, setShowAbout] = useState(false);

    const handleMenuAction = (item: MenuItem) => {
        if (item.action && typeof item.action === 'string' && "") {
            navigate(item.action);
            return;
        }

        if (item.label === t('menu.more.about')) {
            setShowAbout(true);
        }
    };

    const renderMenuItem = (item: MenuItem) => {
        if (item.type === 'separator') {
            return <DropdownMenuSeparator />;
        }

        if (item.submenu) {
            return (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span>{item.label}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {item.submenu.map((subItem, idx) => (
                            <DropdownMenuItem key={idx} onClick={() => handleMenuAction(subItem)}>
                                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                                <span>{subItem.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            );
        }

        return (
            <DropdownMenuItem onClick={() => handleMenuAction(item)}>
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.label}</span>
                {item.shortcut && (
                    <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                )}
            </DropdownMenuItem>
        );
    };

    return (
        <NavigationMenu>
            <NavigationMenuList>
                {menuItems.map((group: MenuGroup) => (
                    <NavigationMenuItem key={group.title}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-normal"
                                >
                                    {group.title}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 text-xs">
                                {group.items.map((item, _idx) => renderMenuItem(item))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>

            <AboutDialog
                isOpen={showAbout}
                onClose={() => setShowAbout(false)}
            />
        </NavigationMenu>
    );
}

declare global {
    interface Window {
        electron: {
            ipcRenderer: any;
            minimize: () => void;
            maximize: () => void;
            close: () => void;
        };
    }
}

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [showSettings, setShowSettings] = useState(false);
    const [platform, setPlatform] = useState('win32');

    useEffect(() => {
        // Detect platform on component mount
        if (window.electron?.ipcRenderer) {
            window.electron.ipcRenderer.invoke('get-platform').then((os: string) => {
                setPlatform(os);
            });
        }
    }, []);

    const menuItems = [
        {
            path: '/',
            icon: Download,
            label: t('navigation.downloader')
        },
        {
            path: '/converter',
            icon: FileOutput,
            label: t('navigation.converter')
        },
        {
            path: '/stem-extractor',
            icon: Music2,
            label: t('navigation.stemExtractor')
        }
    ];

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className={`flex h-12 items-center z-[9999] titlebar-drag-region ${
                platform === 'darwin' ? 'pl-[80px]' : ''
            }`}>
                {/* Left: Menu Bar with platform-specific padding */}
                <div className={`flex-none titlebar-no-drag ${
                    platform === 'darwin' ? 'pl-2' : 'pl-3'
                } pr-2`}>
                    <MenuBar />
                </div>

                {/* Center: Navigation area */}
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center space-x-1 titlebar-no-drag">
                        <div className="bg-muted/50 rounded-lg p-1">
                            {menuItems.map((item, index) => (
                                <span key={item.path}>
                                    <Button
                                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                                        size="sm"
                                        className={`h-7 px-3 text-sm font-medium transition-colors
                                            ${location.pathname === item.path
                                                ? 'bg-background shadow-sm'
                                                : 'hover:bg-muted/60'}`}
                                        onClick={() => navigate(item.path)}
                                    >
                                        <item.icon className="h-4 w-4 mr-2 opacity-70" />
                                        {item.label}
                                    </Button>
                                    {index < menuItems.length - 1 && (
                                        <div className="h-4 w-[1px] bg-border opacity-30 mx-0.5 inline-block" />
                                    )}
                                </span>
                            ))}
                        </div>

                        <Button
                            variant={showSettings ? "secondary" : "ghost"}
                            size="icon"
                            className="h-7 w-7 ml-2"
                            onClick={() => setShowSettings(true)}
                        >
                            <SettingsIcon className="h-4 w-4 opacity-70" />
                        </Button>
                    </div>
                </div>

                {/* Right: Donate Button + platform-specific padding */}
                <div className={`flex-none pl-2 titlebar-no-drag flex items-center gap-2 ${
                    platform === 'darwin' ? 'pr-3' : 'pr-[140px]'
                }`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-3 text-sm font-medium transition-colors hover:bg-pink-500/10
                            ${location.pathname === '/donate' 
                                ? 'text-pink-500 bg-pink-500/10' 
                                : 'text-pink-400 hover:text-pink-500'}`}
                        onClick={() => navigate('/donate')}
                    >
                        <Heart className={`h-4 w-4 mr-2 ${
                            location.pathname === '/donate' ? 'fill-pink-500' : ''
                        }`} />
                        {t('navigation.donate')}
                    </Button>
                </div>
            </div>

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
}


export default Header;
