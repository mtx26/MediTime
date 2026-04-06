import type {
  ActionItem,
  BoxActionHandlers,
} from '@meditime/types';

/**
 * Builds the unified action list for an individual medicine **box**.
 */
export function buildBoxActions(
  handlers: BoxActionHandlers,
  exclude: string[] = [],
): ActionItem[] {
  const actions: ActionItem[] = [];

  const add = (a: ActionItem) => {
    if ('separator' in a) {
      if (
        actions.length > 0 &&
        !('separator' in actions[actions.length - 1])
      ) {
        actions.push(a);
      }
      return;
    }
    if (!exclude.includes(a.id)) actions.push(a);
  };

  add({
    id: 'scan_qr',
    icon: 'scan-line',
    labelKey: 'boxes.scan_qr_code',
    titleKey: 'boxes.scan_qr_code',
    onClick: handlers.onScanQr,
  });

  add({ separator: true });

  add({
    id: 'edit',
    icon: 'pencil',
    labelKey: 'boxes.edit',
    titleKey: 'boxes.edit',
    onClick: handlers.onEdit,
    dataTour: 'box-edit-btn',
  });

  add({
    id: 'view_notice',
    icon: 'file-text',
    labelKey: 'boxes.view_notice',
    titleKey: 'boxes.view_notice',
    onClick: handlers.onViewNotice,
  });

  add({ separator: true });

  add({
    id: 'delete',
    icon: 'trash-2',
    labelKey: 'boxes.delete',
    titleKey: 'boxes.delete',
    onClick: handlers.onDelete,
    danger: true,
  });

  return actions;
}
