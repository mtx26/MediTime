import type { ActionList, BoxActionHandlers } from '@meditime/types';

/**
 * Builds the unified action list for an individual medicine **box**.
 */
export function buildBoxActions(
  handlers: BoxActionHandlers,
  exclude: string[] = [],
): ActionList {
  const actions: ActionList = [
    [
      {
        id: 'scan_qr',
        icon: 'scan-line',
        labelKey: 'boxes.scan_qr_code',
        titleKey: 'boxes.scan_qr_code',
        onClick: handlers.onScanQr,
      },
    ],
    { separator: true },
    [
      {
        id: 'edit',
        icon: 'pencil',
        labelKey: 'boxes.edit',
        titleKey: 'boxes.edit',
        onClick: handlers.onEdit,
        dataTour: 'box-edit-btn',
      },
      {
        id: 'view_notice',
        icon: 'file-text',
        labelKey: 'boxes.view_notice',
        titleKey: 'boxes.view_notice',
        onClick: handlers.onViewNotice,
      },
    ],
    { separator: true },
    [
      {
        id: 'delete',
        icon: 'trash-2',
        labelKey: 'boxes.delete',
        titleKey: 'boxes.delete',
        onClick: handlers.onDelete,
        danger: true,
      },
    ],
  ];

  const visibleActions = actions.reduce<ActionList>((items, item) => {
    if ('separator' in item) {
      if (items.length > 0 && !('separator' in items[items.length - 1])) {
        items.push(item);
      }
      return items;
    }

    const group = item.filter((action) => !exclude.includes(action.id));
    if (group.length > 0) items.push(group);
    return items;
  }, []);

  if (
    visibleActions.length > 0 &&
    'separator' in visibleActions[visibleActions.length - 1]
  ) {
    visibleActions.pop();
  }

  return visibleActions;
}
