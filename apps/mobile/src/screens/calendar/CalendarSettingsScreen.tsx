import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CALENDAR_SETTINGS_TABS } from '@meditime/constants';
import { Text } from 'tamagui';
import type { CalendarSettingsTab } from '@meditime/types';
import { CalendarNotificationSettingsPanel } from '../../components/calendar/CalendarNotificationSettingsPanel';
import { CalendarNotFoundState } from '../../components/calendar/CalendarNotFoundState';
import { CalendarStockSettingsPanel } from '../../components/calendar/CalendarStockSettingsPanel';
import { usePageHeaderOptions } from '../../components/common/Page';
import { SettingsPageShell } from '../../components/settings';
import { useCalendarSettings } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type EditableCalendarSourceType = 'personal' | 'sharedUser';

type CalendarSettingsScreenProps = {
  sourceType: EditableCalendarSourceType;
};

export default function CalendarSettingsScreen({ sourceType }: CalendarSettingsScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const settings = useCalendarSettings(sourceType);

  const headerOptions = usePageHeaderOptions({
    title: String(t('calendar_settings.label')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
  });

  const tabs: Array<{ id: CalendarSettingsTab; label: string; iconName: string }> = sourceType === 'personal'
    ? [
        {
          id: CALENDAR_SETTINGS_TABS.STOCK,
          label: String(t('calendar_settings.stock.label')),
          iconName: 'cube-outline',
        },
        {
          id: CALENDAR_SETTINGS_TABS.NOTIFICATIONS,
          label: String(t('calendar_settings.notifications.label')),
          iconName: 'notifications-outline',
        },
      ]
    : [
        {
          id: CALENDAR_SETTINGS_TABS.NOTIFICATIONS,
          label: String(t('calendar_settings.notifications.label')),
          iconName: 'notifications-outline',
        },
      ];

  return (
    <SettingsPageShell
      loading={settings.loading}
      loadingLabel={String(t('calendar_settings.label'))}
      notFound={settings.notFound}
      notFoundContent={<CalendarNotFoundState onBackToCalendars={settings.backToCalendars} />}
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={settings.refreshing}
          onRefresh={() => void settings.loadSettings('refresh')}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={14}
      tabs={tabs}
      activeTab={settings.activeTab}
      onTabChange={settings.setActiveTab}
      error={settings.error}
      onRetry={() => void settings.loadSettings('refresh')}
    >

      {settings.activeTab === CALENDAR_SETTINGS_TABS.STOCK && sourceType === 'personal' ? (
        <CalendarStockSettingsPanel
          selectedMethod={settings.stockMethod}
          isSaving={settings.isSaving}
          onSelectMethod={settings.updateStockMethod}
        />
      ) : null}

      {settings.activeTab === CALENDAR_SETTINGS_TABS.NOTIFICATIONS ? (
        <CalendarNotificationSettingsPanel
          enabled={settings.notificationsEnabled}
          isSaving={settings.isSaving}
          onToggle={settings.toggleNotifications}
        />
      ) : null}

      {sourceType === 'sharedUser' ? (
        <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
          {t('calendar_settings.notifications.description')}
        </Text>
      ) : null}
    </SettingsPageShell>
  );
}
