import type { Step } from 'react-joyride';
import type { TFunction } from 'i18next';

export function getTourSteps(t: TFunction): Step[] {
  return [
    // 0. Welcome (Dashboard)
    {
      target: 'body',
      content: t('tour.welcome_content'),
      title: t('tour.welcome_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 1. Add Calendar Button (Dashboard)
    {
      target: '[data-tour="add-calendar-btn"]',
      content: t('tour.add_calendar_content'),
      title: t('tour.add_calendar_title'),
      disableBeacon: true,
    },
    // 2. Name Input (Add Page)
    {
      target: '[data-tour="calendar-name-input"]',
      content: t('tour.calendar_name_content'),
      title: t('tour.calendar_name_title'),
      disableBeacon: true,
    },
    // 3. Import Type (Add Page)
    {
      target: '[data-tour="import-type-select"]',
      content: t('tour.import_type_content'),
      title: t('tour.import_type_title'),
      disableBeacon: true,
    },
    // 4. Submit (Add Page)
    {
      target: '[data-tour="submit-calendar-btn"]',
      content: t('tour.submit_calendar_content'),
      title: t('tour.submit_calendar_title'),
      disableBeacon: true,
    },
    // 5. Go to Calendar (Transition)
    {
      target: 'body',
      content: t('tour.go_to_calendar_content'),
      title: t('tour.go_to_calendar_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 6. Medicines Button (Calendar View)
    {
      target: '[data-tour="nav-medicines-btn"]',
      content: t('tour.medicines_btn_content'),
      title: t('tour.medicines_btn_title'),
      disableBeacon: true,
    },
    // 7. Stock Intro (Boxes View)
    {
      target: '[data-tour="stock-view-title"]',
      content: t('tour.stock_intro_content'),
      title: t('tour.stock_intro_title'),
      placement: 'bottom',
      disableBeacon: true,
    },
    // 8. Add Manual (Boxes View)
    {
      target: '[data-tour="add-manual-btn"]',
      content: t('tour.add_manual_content'),
      title: t('tour.add_manual_title'),
      disableBeacon: true,
    },
    // 9. Add QR (Boxes View)
    {
      target: '[data-tour="add-qr-btn"]',
      content: t('tour.add_qr_content'),
      title: t('tour.add_qr_title'),
      disableBeacon: true,
    },
    // 10. Box Condition (Boxes View)
    {
      target: '[data-tour="box-condition-toggle"]',
      content: t('tour.box_condition_content'),
      title: t('tour.box_condition_title'),
      disableBeacon: true,
    },
    // 11. Calendar Grid (Desktop)
    {
      target: '[data-tour="calendar-grid-desktop"]',
      content: t('tour.calendar_grid_content'),
      title: t('tour.calendar_grid_title'),
      placement: 'left',
      disableBeacon: true,
    },
    // 12. Calendar Grid (Mobile Button)
    {
      target: '[data-tour="calendar-grid-mobile-btn"]',
      content: t('tour.calendar_grid_content'),
      title: t('tour.calendar_grid_title'),
      placement: 'left',
      disableBeacon: true,
    },
    // 13. Week Selector
    {
      target: '[data-tour="calendar-week-selector"]',
      content: t('tour.week_selector_content'),
      title: t('tour.week_selector_title'),
      disableBeacon: true,
    },
    // 14. Actions (Calendar View)
    {
      target: '[data-tour="calendar-actions-btn"]',
      content: t('tour.calendar_actions_content'),
      title: t('tour.calendar_actions_title'),
      disableBeacon: true,
    },
    // 15. Settings
    {
      target: '[data-tour="calendar-settings-btn"]',
      content: t('tour.settings_btn_content'),
      title: t('tour.settings_btn_title'),
      disableBeacon: true,
    },
    // 16. Settings Page (Demo)
    {
      target: 'body',
      content: t('tour.settings_page_content'),
      title: t('tour.settings_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 17. Stock Settings Tab
    {
      target: '[data-tour="settings-stock-methods"]',
      content: t('tour.stock_settings_content'),
      title: t('tour.stock_settings_title'),
      disableBeacon: true,
    },
    // 18. Notifications Settings Tab
    {
      target: '[data-tour="settings-notifications-toggle"]',
      content: t('tour.notifications_settings_content'),
      title: t('tour.notifications_settings_title'),
      disableBeacon: true,
    },
    // 19. Share Calendar
    {
      target: '[data-tour="share-calendar-btn"]',
      content: t('tour.share_btn_content'),
      title: t('tour.share_btn_title'),
      disableBeacon: true,
    },
    // 20. Share Page (Demo)
    {
      target: 'body',
      content: t('tour.share_page_content'),
      title: t('tour.share_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 21. Public Links
    {
      target: '[data-tour="share-public-links"]',
      content: t('tour.public_links_content'),
      title: t('tour.public_links_title'),
      disableBeacon: true,
    },
    // 22. Shared Users
    {
      target: '[data-tour="share-users-list"]',
      content: t('tour.shared_users_content'),
      title: t('tour.shared_users_title'),
      disableBeacon: true,
    },
    // 23. Invite User
    {
      target: '[data-tour="share-invite-user-form"]',
      content: t('tour.invite_user_content'),
      title: t('tour.invite_user_title'),
      disableBeacon: true,
    },
    // 24. Export PDF
    {
      target: '[data-tour="export-pdf-btn"]',
      content: t('tour.export_pdf_content'),
      title: t('tour.export_pdf_title'),
      disableBeacon: true,
    },
    // 25. Stock Alerts
    {
      target: '[data-tour="stock-alerts-btn"]',
      content: t('tour.stock_alerts_content'),
      title: t('tour.stock_alerts_title'),
      disableBeacon: true,
    },
    // 26. Stock Alerts Page (Demo)
    {
      target: 'body',
      content: t('tour.stock_alerts_page_content'),
      title: t('tour.stock_alerts_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 27. Send SMS
    {
      target: '[data-tour="send-sms-btn"]',
      content: t('tour.send_sms_content'),
      title: t('tour.send_sms_title'),
      disableBeacon: true,
    },
    // 28. ICS Calendar
    {
      target: '[data-tour="ics-calendar-btn"]',
      content: t('tour.ics_calendar_content'),
      title: t('tour.ics_calendar_title'),
      disableBeacon: true,
    },
    // 29. Pillbox History
    {
      target: '[data-tour="pillbox-history-btn"]',
      content: t('tour.pillbox_history_content'),
      title: t('tour.pillbox_history_title'),
      disableBeacon: true,
    },
  ];
}
