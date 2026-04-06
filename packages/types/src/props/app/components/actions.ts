/* ------------------------------------------------------------------ */
/* ActionDefinition – platform-agnostic action descriptors            */
/* Reusable across React Web and React Native                         */
/* ------------------------------------------------------------------ */

/** A concrete action entry (navigation or handler) */
export interface ActionDefinition {
  /** Unique identifier for the action (e.g. 'delete', 'share') */
  id: string;
  /** Lucide icon name in kebab-case (e.g. 'trash-2', 'share-2', 'settings') */
  icon: string;
  /** i18n translation key for the label text */
  labelKey: string;
  /** i18n translation key for the title / aria-label */
  titleKey: string;
  /** Mark as destructive / danger action */
  danger?: boolean;
  /** Data-tour attribute for onboarding flows */
  dataTour?: string;
  /** Static navigation link (route path) */
  linkTo?: string;
  /** Action handler callback */
  onClick?: () => void;
}

/** A visual separator between action groups */
export interface ActionSeparator {
  separator: true;
}

/** Union type for items in an action list */
export type ActionItem = ActionDefinition | ActionSeparator;

/** Type guard: checks if an ActionItem is a separator */
export function isActionSeparator(item: ActionItem): item is ActionSeparator {
  return 'separator' in item && (item as ActionSeparator).separator === true;
}

/* ------------------------------------------------------------------ */
/* Builder parameter types                                            */
/* ------------------------------------------------------------------ */

/** Route context shared by all calendar action builders */
export interface CalendarActionContext {
  calendarId: string;
  lng: string;
  basePath: string;
  selectedDate?: Date | null;
}

/** Callback handlers for calendar actions */
export interface CalendarActionHandlers {
  onRename?: () => void;
  onDelete: () => void;
  onExportPdf: () => void;
}

/** Route context for box (medicine) actions */
export interface BoxActionContext {
  calendarId: string;
  boxId: string;
}

/** Callback handlers for box actions */
export interface BoxActionHandlers {
  onScanQr: () => void;
  onEdit: () => void;
  onViewNotice: () => void;
  onDelete: () => void;
}

/** Callback handlers for notification actions */
export interface NotificationActionHandlers {
  onMarkAllRead: () => void;
}

/** Route context for notification actions */
export interface NotificationActionContext {
  lng: string;
}

/** Route context for stock alert actions */
export interface StockAlertActionContext {
  calendarId: string;
  lng: string;
  basePath: string;
}

/** Callback handlers for stock alert actions */
export interface StockAlertActionHandlers {
  onSendSms: () => void;
}
