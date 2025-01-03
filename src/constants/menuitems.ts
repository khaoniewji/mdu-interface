// src/constants/menuitems.ts
import { TFunction } from 'i18next';
import { 
  FileIcon, 
  EditIcon, 
  MonitorIcon, 
  PenTool, 
  MoreHorizontalIcon,
  PlusIcon,
  FolderOpenIcon,
  ClockIcon,
  SaveIcon,
  SettingsIcon,
  LogOutIcon,
  UndoIcon,
  RedoIcon,
  ScissorsIcon,
  CopyIcon,
  ClipboardIcon,
  TrashIcon,
  CheckSquareIcon,
  XSquareIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  SidebarIcon,
  TerminalIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  DownloadIcon,
  LayersIcon,
  Music2Icon,
  VideoIcon,
  WrenchIcon,
  Sliders,
  CodeIcon,
  RefreshCwIcon,
  BookOpenIcon,
  KeyboardIcon,
  BugIcon,
  MessagesSquareIcon,
  InfoIcon
} from 'lucide-react';

export interface MenuItem {
  label: string;
  shortcut?: string;
  icon?: any;
  action?: () => void;
  type?: 'separator';
  submenu?: MenuItem[];
}

export interface MenuGroup {
  title: string;
  icon: any;
  items: MenuItem[];
}

export const createMenuItems = (t: TFunction): MenuGroup[] => [
  {
    title: t('menu.file.title'),
    icon: FileIcon,
    items: [
      { label: t('menu.file.newProject'), shortcut: 'Ctrl+N', icon: PlusIcon },
      { label: t('menu.file.openProject'), shortcut: 'Ctrl+O', icon: FolderOpenIcon },
      { label: t('menu.file.openRecent'), icon: ClockIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.file.save'), shortcut: 'Ctrl+S', icon: SaveIcon },
      { label: t('menu.file.saveAs'), shortcut: 'Ctrl+Shift+S', icon: SaveIcon },
      { label: t('menu.file.export'), shortcut: 'Ctrl+E', icon: FileIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.file.projectSettings'), shortcut: 'Ctrl+,', icon: SettingsIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.file.exit'), shortcut: 'Alt+F4', icon: LogOutIcon }
    ]
  },
  {
    title: t('menu.edit.title'),
    icon: EditIcon,
    items: [
      { label: t('menu.edit.undo'), shortcut: 'Ctrl+Z', icon: UndoIcon },
      { label: t('menu.edit.redo'), shortcut: 'Ctrl+Y', icon: RedoIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.edit.cut'), shortcut: 'Ctrl+X', icon: ScissorsIcon },
      { label: t('menu.edit.copy'), shortcut: 'Ctrl+C', icon: CopyIcon },
      { label: t('menu.edit.paste'), shortcut: 'Ctrl+V', icon: ClipboardIcon },
      { label: t('menu.edit.delete'), shortcut: 'Delete', icon: TrashIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.edit.selectAll'), shortcut: 'Ctrl+A', icon: CheckSquareIcon },
      { label: t('menu.edit.deselect'), shortcut: 'Ctrl+D', icon: XSquareIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.edit.preferences'), shortcut: 'Ctrl+P', icon: SettingsIcon }
    ]
  },
  {
    title: t('menu.view.title'),
    icon: MonitorIcon,
    items: [
      { label: t('menu.view.zoomIn'), shortcut: 'Ctrl+Plus', icon: ZoomInIcon },
      { label: t('menu.view.zoomOut'), shortcut: 'Ctrl+Minus', icon: ZoomOutIcon },
      { label: t('menu.view.resetZoom'), shortcut: 'Ctrl+0', icon: MaximizeIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.view.toggleFullscreen'), shortcut: 'F11', icon: MaximizeIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.view.showSidebar'), shortcut: 'Ctrl+B', icon: SidebarIcon },
      { label: t('menu.view.showConsole'), shortcut: 'Ctrl+`', icon: TerminalIcon },
      { label: t('menu.view.showStatusBar'), icon: MonitorIcon },
      {
        type: 'separator',
        label: ''
      },
      {
        label: t('menu.view.theme.title'),
        icon: SunIcon,
        submenu: [
          { label: t('menu.view.theme.light'), icon: SunIcon },
          { label: t('menu.view.theme.dark'), icon: MoonIcon },
          { label: t('menu.view.theme.system'), icon: LaptopIcon }
        ]
      }
    ]
  },
  {
    title: t('menu.tools.title'),
    icon: PenTool,
    items: [
      { label: t('menu.tools.downloadManager'), shortcut: 'Ctrl+D', icon: DownloadIcon },
      { label: t('menu.tools.batchConverter'), shortcut: 'Ctrl+B', icon: LayersIcon },
      { label: t('menu.tools.audioExtractor'), shortcut: 'Ctrl+A', icon: Music2Icon },
      { label: t('menu.tools.videoRemuxer'), shortcut: 'Ctrl+R', icon: VideoIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.tools.formatSettings'), icon: WrenchIcon },
      { label: t('menu.tools.qualityPresets'), icon: Sliders },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.tools.developerTools'), shortcut: 'F12', icon: CodeIcon }
    ]
  },
  {
    title: t('menu.more.title'),
    icon: MoreHorizontalIcon,
    items: [
      { label: t('menu.more.checkUpdates'), icon: RefreshCwIcon },
      { label: t('menu.more.documentation'), shortcut: 'F1', icon: BookOpenIcon },
      { label: t('menu.more.keyboardShortcuts'), shortcut: 'Ctrl+K', icon: KeyboardIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.more.reportIssue'), icon: BugIcon },
      { label: t('menu.more.supportForum'), icon: MessagesSquareIcon },
      {
        type: 'separator',
        label: ''
      },
      { label: t('menu.more.about'), icon: InfoIcon }
    ]
  }
];