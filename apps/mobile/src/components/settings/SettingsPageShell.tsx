import { useTranslation } from 'react-i18next';
import type { SettingsPageShellProps } from '@meditime/types';
import { YStack } from 'tamagui';
import { InfoBanner } from '../common/InfoBanner';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { OutlineButton } from '../common/OutlineButton';
import { Page } from '../common/Page';
import { SettingsTabBar } from './SettingsTabBar';

export function SettingsPageShell<TTabId extends string = string>({
  activeTab,
  backgroundDecoration,
  children,
  error,
  footer,
  gap = 16,
  loading,
  loadingLabel,
  notFound = false,
  notFoundContent = null,
  onRetry = null,
  refreshControl,
  screen,
  tabs,
  onTabChange,
  withBottomTabInset = true,
}: SettingsPageShellProps<TTabId>) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <>
        {screen}
        <LoadingIndicator label={loadingLabel} variant="screen" />
      </>
    );
  }

  if (notFound && notFoundContent) {
    return (
      <>
        {screen}
        {notFoundContent}
      </>
    );
  }

  return (
    <Page
      backgroundDecoration={backgroundDecoration}
      screen={screen}
      refreshControl={refreshControl}
      gap={gap}
      withBottomTabInset={withBottomTabInset}
    >
      {tabs && tabs.length > 1 && activeTab !== undefined && onTabChange ? (
        <SettingsTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      ) : null}

      {error ? (
        <YStack style={{ gap: 10 }}>
          <InfoBanner iconName="warning-outline" text={error} tone="warning" />
          {onRetry ? <OutlineButton label={String(t('retry'))} onPress={onRetry} /> : null}
        </YStack>
      ) : null}

      {children}
      {footer}
    </Page>
  );
}
