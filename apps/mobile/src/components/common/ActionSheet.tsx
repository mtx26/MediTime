import { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

const web = {
  background: '#ffffff',
  foreground: '#020817',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  accentHover: '#f1f5f9',
  destructive: '#dc2626',
};

export type MobileActionSheetAction = {
  label?: string;
  title?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
};

type ActionSheetProps = {
  actions: MobileActionSheetAction[];
  buttonSize?: 'sm' | 'default';
  dataTour?: string;
  onNavigate?: (href: string) => void;
};

function ActionSheet({ actions, buttonSize = 'default', onNavigate }: ActionSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const closeAndRun = (action: MobileActionSheetAction) => {
    setOpen(false);
    if (action.linkTo) {
      onNavigate?.(action.linkTo);
      return;
    }
    action.onClick?.();
  };

  return (
    <>
      <Button
        size={buttonSize === 'sm' ? '$2' : '$3'}
        onPress={() => setOpen(true)}
        aria-label={t('Actions')}
        style={{
          width: buttonSize === 'sm' ? 36 : 40,
          minHeight: buttonSize === 'sm' ? 36 : 40,
          paddingHorizontal: 0,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: web.border,
          backgroundColor: web.background,
        }}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={web.foreground} />
      </Button>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(2, 8, 23, 0.35)',
          }}
        >
          <Pressable>
            <YStack
              style={{
                margin: 12,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: web.border,
                borderRadius: 8,
                backgroundColor: web.background,
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}
            >
              <ScrollView style={{ maxHeight: 520 }}>
                {actions.map((action, index) => {
                  if (action.separator) {
                    return (
                      <YStack
                        key={`separator-${index}`}
                        style={{ height: 1, backgroundColor: web.border, marginVertical: 4 }}
                      />
                    );
                  }

                  return (
                    <Pressable
                      key={`${action.title ?? action.label ?? 'action'}-${index}`}
                      onPress={() => closeAndRun(action)}
                      accessibilityRole="button"
                      accessibilityLabel={action.title}
                    >
                      {({ pressed }) => (
                        <XStack
                          style={{
                            minHeight: 44,
                            alignItems: 'center',
                            gap: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            backgroundColor: pressed ? web.accentHover : web.background,
                          }}
                        >
                          {action.iconName && (
                            <Ionicons
                              name={action.iconName}
                              size={18}
                              color={action.danger ? web.destructive : web.foreground}
                            />
                          )}
                          <Text
                            style={{
                              flex: 1,
                              color: action.danger ? web.destructive : web.foreground,
                              fontSize: 15,
                              fontWeight: '600',
                            }}
                          >
                            {action.label}
                          </Text>
                        </XStack>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default ActionSheet;
