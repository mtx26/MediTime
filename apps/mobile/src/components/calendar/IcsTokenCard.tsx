import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { IcsTokenCardProps } from '@meditime/types';
import { GlassSurface } from '../common/GlassSurface';
import { useGlassEffectEnabled } from '../common/GlassSurface';
import { useIosTheme } from '../../theme/ios';

function getShortToken(token: string) {
  if (token.length <= 8) return token.toUpperCase();
  return token.slice(0, 8).toUpperCase();
}

type ActionIconButtonProps = {
  disabled: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'destructive';
};

function ActionIconButton({
  disabled,
  iconName,
  label,
  onPress,
  tone = 'default',
}: ActionIconButtonProps) {
  const ios = useIosTheme();
  const glassEnabled = useGlassEffectEnabled();
  const isDestructive = tone === 'destructive';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <GlassSurface
          glassEffectStyle="clear"
          tintColor={isDestructive ? ios.destructiveBg : undefined}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderColor: isDestructive
              ? ios.destructiveBorder
              : pressed && glassEnabled ? ios.primary : 'transparent',
            opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
          }}
        >
          <Ionicons
            name={iconName}
            size={18}
            color={isDestructive ? ios.destructive : ios.primary}
          />
        </GlassSurface>
      )}
    </Pressable>
  );
}

type PrimaryActionButtonProps = {
  disabled: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function PrimaryActionButton({
  disabled,
  iconName,
  label,
  onPress,
}: PrimaryActionButtonProps) {
  const ios = useIosTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <GlassSurface
          tintColor={ios.blueInfoBg}
          style={{
            minHeight: 44,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 12,
            borderColor: pressed ? ios.primary : ios.blueInfoBorder,
            paddingHorizontal: 14,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <Ionicons name={iconName} size={18} color={ios.primary} />
          <Text style={{ color: ios.primary, fontSize: 15, fontWeight: '800' }}>
            {label}
          </Text>
        </GlassSurface>
      )}
    </Pressable>
  );
}

export function IcsTokenCard({
  token,
  webcalUrl,
  disabled = false,
  onDelete,
  onShare,
  onSubscribe,
}: IcsTokenCardProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const ownerLabel = token.owner_display_name || token.owner_email || '-';
  const tokenValue = getShortToken(token.token);
  const subtitle = ownerLabel !== '-' ? ownerLabel : String(t('ics.calendar_ics'));

  return (
    <GlassSurface
      style={{
        gap: 12,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <XStack
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: ios.accentHover,
          }}
        >
          <Ionicons name="link-outline" size={18} color={ios.primary} />
        </XStack>

        <YStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ color: ios.foreground, fontSize: 17, lineHeight: 22, fontWeight: '900' }}>
            {`ICS ${tokenValue}`}
          </Text>

          <Text numberOfLines={1} style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </YStack>

        <XStack style={{ alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
          <ActionIconButton
            disabled={disabled}
            iconName="share-outline"
            label={String(t('copy_link'))}
            onPress={() => onShare(webcalUrl)}
          />
          <ActionIconButton
            disabled={disabled}
            iconName="trash-outline"
            label={String(t('delete'))}
            onPress={() => onDelete(token)}
            tone="destructive"
          />
        </XStack>
      </XStack>

      <PrimaryActionButton
        disabled={disabled}
        iconName="calendar-outline"
        label={String(t('ics.sync_calendar'))}
        onPress={() => onSubscribe(webcalUrl)}
      />
    </GlassSurface>
  );
}
