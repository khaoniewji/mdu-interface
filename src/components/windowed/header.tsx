// src/components/windowed/header.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Download,
    FileOutput,
    Music2,
    Settings as SettingsIcon,
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
// import { cn } from "@/lib/utils";

function MenuBar() {
    const { t } = useTranslation();
    const menuItems = createMenuItems(t);
    const [showAbout, setShowAbout] = useState(false);

    const handleMenuAction = (item: MenuItem) => {
        if (item.label === t('menu.more.about')) {
            setShowAbout(true);
        }
        // Add other menu actions here
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
                                <p className='text-xs'>{group.items.map((item, _idx) => renderMenuItem(item))}</p>
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

const WindowControls = () => (
    <div className="flex items-center space-x-2">
        <button className="hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md">
            <svg width="12" height="12" viewBox="0 0 12 12">
                <rect width="10" height="1" x="1" y="5.5" fill="currentColor" />
            </svg>
        </button>
        <button className="hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md">
            <svg width="12" height="12" viewBox="0 0 12 12">
                <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
            </svg>
        </button>
        <button className="hover:bg-red-500 group p-1.5 rounded-md">
            <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                    d="M2.4 1.399a.708.708 0 00-1 1L4.6 5.599l-3.2 3.2a.708.708 0 001 1l3.2-3.2 3.2 3.2a.708.708 0 001-1L6.6 5.599l3.2-3.2a.708.708 0 00-1-1l-3.2 3.2z"
                    fill="currentColor"
                    className="group-hover:fill-white"
                />
            </svg>
        </button>
    </div>
);

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [showSettings, setShowSettings] = useState(false);
  
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
      <div className="border-b bg-background">
        <div className="flex h-10 items-center">
          {/* Left: Menu Bar */}
          <div className="flex-none px-2">
            <MenuBar />
          </div>
  
          {/* Center: Navigation + Settings */}
          <div className="flex-1 flex justify-center items-center space-x-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                className="h-8"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
  
            <div className="h-4 w-[1px] bg-border mx-2" />
  
            <Button
              variant={showSettings ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(true)}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </div>
  
          {/* Right: Window Controls */}
          <div className="flex-none px-2">
            <WindowControls />
          </div>
        </div>
  
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }
  
  // Add this type definition at the top of your file
  declare global {
    interface Window {
      electron: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    }
  }
  
  export default Header;