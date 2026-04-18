import { Ionicons } from '@expo/vector-icons';
import type { ActionItem } from '@meditime/types';
import type { MobileActionSheetAction } from '../components/common/ActionSheet';

const ICON_MAP: Partial<Record<string, keyof typeof Ionicons.glyphMap>> = {
  eye: 'eye-outline',
  pencil: 'pencil-outline',
  'grid-3x3': 'grid-outline',
  'calendar-days': 'calendar-outline',
  'share-2': 'share-social-outline',
  pill: 'medkit-outline',
  download: 'download-outline',
  'alert-triangle': 'warning-outline',
  calendar: 'calendar-outline',
  'calendar-off': 'calendar-clear-outline',
  clock: 'time-outline',
  settings: 'settings-outline',
  'trash-2': 'trash-outline',
  'scan-line': 'scan-outline',
  'file-text': 'document-text-outline',
  bell: 'notifications-outline',
  'message-square': 'chatbox-ellipses-outline',
};

export function toActionSheetItems(
  items: ActionItem[],
  t: (key: string) => string,
): MobileActionSheetAction[] {
  return items.map((item) => {
    if ('separator' in item) {
      return { separator: true };
    }

    return {
      label: t(item.labelKey),
      title: t(item.titleKey),
      iconName: ICON_MAP[item.icon],
      linkTo: item.linkTo,
      onClick: item.onClick,
      danger: item.danger,
      dataTour: item.dataTour,
    };
  });
}
