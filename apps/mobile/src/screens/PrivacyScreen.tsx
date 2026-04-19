import { Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import { HomeReturnButton } from '../components/common/HomeReturnButton';
import { PrivacyDataGroup } from '../components/common/PrivacyDataGroup';
import { PrivacySection } from '../components/common/PrivacySection';
import { useIosTheme } from '../theme/ios';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();

  return (
    <ScrollView flex={1} style={{ flex: 1, backgroundColor: ios.background }}>
      <YStack
        style={{
          flex: 1,
          gap: 22,
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 18),
          paddingBottom: Math.max(insets.bottom, 18) + 20,
          backgroundColor: ios.background,
        }}
      >
        <HomeReturnButton />

        <YStack style={{ gap: 8 }}>
          <XStack style={{ alignItems: 'center', gap: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={28} color={ios.primary} />
            <Text
              style={{
                flex: 1,
                color: ios.foreground,
                fontSize: 26,
                lineHeight: 32,
                fontWeight: '900',
              }}
            >
              {t('privacy.title')}
            </Text>
          </XStack>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 22, fontWeight: '800' }}>
            {t('privacy.last_update')}
          </Text>
        </YStack>

        <PrivacySection
          titleKey="privacy.section1.title"
          paragraphs={['privacy.section1.content']}
        />

        <YStack
          style={{
            gap: 16,
            paddingBottom: 22,
            borderBottomWidth: 1,
            borderBottomColor: ios.border,
          }}
        >
          <Text
            style={{
              color: ios.foreground,
              fontSize: 20,
              lineHeight: 26,
              fontWeight: '800',
            }}
          >
            {t('privacy.section2.title')}
          </Text>
          <PrivacyDataGroup
            iconName="person-circle-outline"
            titleKey="privacy.section2.personal_data.title"
            itemKeys={[
              'privacy.section2.personal_data.email',
              'privacy.section2.personal_data.uid',
            ]}
          />
          <PrivacyDataGroup
            iconName="medical-outline"
            titleKey="privacy.section2.treatment_data.title"
            itemKeys={[
              'privacy.section2.treatment_data.medicines',
              'privacy.section2.treatment_data.boxes',
              'privacy.section2.treatment_data.history',
            ]}
          />
          <PrivacyDataGroup
            iconName="phone-portrait-outline"
            titleKey="privacy.section2.tech_data.title"
            itemKeys={[
              'privacy.section2.tech_data.tokens',
              'privacy.section2.tech_data.device',
            ]}
          />
        </YStack>

        <PrivacySection
          titleKey="privacy.section3.title"
          list={[
            'privacy.section3.sync',
            'privacy.section3.reminders',
            'privacy.section3.sharing',
            'privacy.section3.stability',
          ]}
          highlightKey="privacy.section3.no_ads"
        />

        <PrivacySection
          titleKey="privacy.section4.title"
          list={[
            'privacy.section4.supabase',
            'privacy.section4.firebase',
          ]}
          conclusionKey="privacy.section4.location"
        />

        <PrivacySection
          titleKey="privacy.section5.title"
          list={[
            'privacy.section5.encryption',
            'privacy.section5.auth',
            'privacy.section5.passwords',
          ]}
        />

        <YStack
          style={{
            gap: 12,
            paddingBottom: 22,
            borderBottomWidth: 1,
            borderBottomColor: ios.border,
          }}
        >
          <PrivacySection
            titleKey="privacy.section6.title"
            paragraphs={['privacy.section6.intro']}
            list={[
              'privacy.section6.access',
              'privacy.section6.delete',
              'privacy.section6.revoke',
              'privacy.section6.disable',
            ]}
            withDivider={false}
          />
          <Text style={{ color: ios.mutedForeground, fontSize: 15, lineHeight: 22 }}>
            {t('privacy.section6.contact')}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL('mailto:mtx_26@outlook.be')}
          >
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="mail-outline" size={18} color={ios.primary} />
              <Text style={{ flex: 1, color: ios.primary, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>
                mtx_26@outlook.be
              </Text>
            </XStack>
          </Pressable>
        </YStack>

        <YStack style={{ gap: 12 }}>
          <Text
            style={{
              color: ios.foreground,
              fontSize: 20,
              lineHeight: 26,
              fontWeight: '800',
            }}
          >
            {t('privacy.section7.title')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 15, lineHeight: 22 }}>
            {t('privacy.section7.developer')}
          </Text>
          <YStack style={{ gap: 10 }}>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL('mailto:mtx_26@outlook.be')}
            >
              <XStack style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="mail-outline" size={18} color={ios.primary} />
                <Text style={{ flex: 1, color: ios.primary, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>
                  mtx_26@outlook.be
                </Text>
              </XStack>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL('https://meditime-app.com')}
            >
              <XStack style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="globe-outline" size={18} color={ios.primary} />
                <Text style={{ flex: 1, color: ios.primary, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>
                  meditime-app.com
                </Text>
              </XStack>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL('https://github.com/mtx26')}
            >
              <XStack style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="logo-github" size={18} color={ios.primary} />
                <Text style={{ flex: 1, color: ios.primary, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>
                  GitHub - mtx26
                </Text>
              </XStack>
            </Pressable>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
