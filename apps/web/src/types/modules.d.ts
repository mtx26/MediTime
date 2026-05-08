declare module 'firebase/firestore' {
  export const getFirestore: (app?: unknown) => unknown;
}

declare module 'firebase/messaging' {
  export const getMessaging: (app?: unknown) => unknown;
  export const getToken: (messaging: unknown, options?: { vapidKey?: string }) => Promise<string>;
}

declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';

  export type LucideProps = SVGProps<SVGSVGElement> & {
    absoluteStrokeWidth?: boolean;
    color?: string;
    size?: number | string;
    strokeWidth?: number | string;
  };

  export type LucideIcon = ComponentType<LucideProps>;

  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowRightCircle: LucideIcon;
  export const Bell: LucideIcon;
  export const BellOff: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const CalendarOff: LucideIcon;
  export const CalendarPlus: LucideIcon;
  export const CalendarRange: LucideIcon;
  export const Camera: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronLeftIcon: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const CircleCheckIcon: LucideIcon;
  export const CircleIcon: LucideIcon;
  export const Clipboard: LucideIcon;
  export const Clock: LucideIcon;
  export const CloudUpload: LucideIcon;
  export const Download: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const FileText: LucideIcon;
  export const Github: LucideIcon;
  export const Globe: LucideIcon;
  export const Grid3X3: LucideIcon;
  export const GripVerticalIcon: LucideIcon;
  export const History: LucideIcon;
  export const Home: LucideIcon;
  export const Info: LucideIcon;
  export const InfoIcon: LucideIcon;
  export const Languages: LucideIcon;
  export const Link2: LucideIcon;
  export const Loader2: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const Lock: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const MinusIcon: LucideIcon;
  export const Moon: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreHorizontalIcon: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const OctagonXIcon: LucideIcon;
  export const Package: LucideIcon;
  export const Palette: LucideIcon;
  export const PanelLeftIcon: LucideIcon;
  export const PauseCircle: LucideIcon;
  export const Pencil: LucideIcon;
  export const Phone: LucideIcon;
  export const Pill: LucideIcon;
  export const Pin: LucideIcon;
  export const Plus: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const QrCode: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Save: LucideIcon;
  export const ScanLine: LucideIcon;
  export const SearchIcon: LucideIcon;
  export const Settings: LucideIcon;
  export const Share2: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Sliders: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Sun: LucideIcon;
  export const Trash2: LucideIcon;
  export const TriangleAlertIcon: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserCog: LucideIcon;
  export const UserCircle: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserPlus2: LucideIcon;
  export const UserRoundPlus: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const XIcon: LucideIcon;
  export const ZoomIn: LucideIcon;
}
