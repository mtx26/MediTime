import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import { HomeReturnButton } from '../common/HomeReturnButton';
import { InfoBanner } from '../common/InfoBanner';
import { useIosTheme } from '../../theme/ios';

export function AcceptInviteEmptyState() {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack
      style={{
        flex: 1,
        justifyContent: 'center',
        gap: 14,
        padding: 18,
        backgroundColor: ios.background,
      }}
    >
      <InfoBanner iconName="warning-outline" text={String(t('invitation.invalid_or_expired'))} tone="warning" />
      <HomeReturnButton />
    </YStack>
  );
}
