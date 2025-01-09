// electron/menu.ts
import { Menu, MenuItemConstructorOptions, app } from 'electron';
import { createMenuItems, MenuItem, MenuGroup } from '../src/constants/menuitems';
import i18next from 'i18next';

function convertMenuItems(menuGroups: MenuGroup[]): MenuItemConstructorOptions[] {
  return menuGroups.map((group) => {
    const submenuItems = group.items.map((item: MenuItem): MenuItemConstructorOptions => {
      if (item.type === 'separator') {
        return { type: 'separator' };
      }

      const menuItem: MenuItemConstructorOptions = {
        label: item.label,
        accelerator: item.shortcut?.replace('Ctrl', 'CommandOrControl'),
      };

      if (item.submenu) {
        menuItem.submenu = item.submenu.map((subItem): MenuItemConstructorOptions => ({
          label: subItem.label,
          accelerator: subItem.shortcut?.replace('Ctrl', 'CommandOrControl'),
        }));
      }

      return menuItem;
    });

    return {
      label: group.title,
      submenu: submenuItems
    };
  });
}

export function createNativeMenu() {
  // Add the macOS app menu
  const macOSAppMenu: MenuItemConstructorOptions = {
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  };

  // Convert menu items from your configuration
  const menuItems = createMenuItems(i18next.t);
  const template = convertMenuItems(menuItems);

  // Insert macOS app menu at the beginning for macOS
  if (process.platform === 'darwin') {
    template.unshift(macOSAppMenu);
  }

  // Create and set the menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}