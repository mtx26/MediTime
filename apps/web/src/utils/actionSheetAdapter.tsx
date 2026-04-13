import type { ReactNode } from 'react';
import type { ActionItem, ActionSheetAction } from '@meditime/types';
import {
  Eye, Pencil, Grid3X3, CalendarDays, Share2, Pill, Download,
  AlertTriangle, Calendar, CalendarOff, Clock, Settings, Trash2, ScanLine,
  FileText, Bell, MessageSquare,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Icon mapping: kebab-case name → Lucide React component             */
/* ------------------------------------------------------------------ */

const ICON_MAP: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
  'eye': Eye,
  'pencil': Pencil,
  'grid-3x3': Grid3X3,
  'calendar-days': CalendarDays,
  'share-2': Share2,
  'pill': Pill,
  'download': Download,
  'alert-triangle': AlertTriangle,
  'calendar': Calendar,
  'calendar-off': CalendarOff,
  'clock': Clock,
  'settings': Settings,
  'trash-2': Trash2,
  'scan-line': ScanLine,
  'file-text': FileText,
  'bell': Bell,
  'message-square': MessageSquare,
};

/* ------------------------------------------------------------------ */
/* Adapter: ActionItem[] → ActionSheetAction<ReactNode>[]             */
/* ------------------------------------------------------------------ */

/**
 * Converts platform-agnostic `ActionItem[]` (from `@meditime/utils`)
 * into the web-specific `ActionSheetAction<ReactNode>[]` expected by
 * the `<ActionSheet>` component.
 *
 * @param items  – action definitions from a builder function
 * @param t      – i18next `t` function for translating keys
 */
export function toActionSheetItems(
  items: ActionItem[],
  t: (key: string) => string,
): ActionSheetAction<ReactNode>[] {
  return items.map((item) => {
    if ('separator' in item) {
      return { separator: true };
    }

    const Icon = ICON_MAP[item.icon];
    const label: ReactNode = (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {t(item.labelKey)}
      </div>
    );

    return {
      label,
      title: t(item.titleKey),
      linkTo: item.linkTo,
      onClick: item.onClick,
      danger: item.danger,
      dataTour: item.dataTour,
    };
  });
}
