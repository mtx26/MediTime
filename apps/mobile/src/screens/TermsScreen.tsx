import { Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import { TermsSection } from '../components/common/TermsSection';
import { useIosTheme } from '../theme/ios';

export default function TermsScreen() {
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
        <YStack style={{ gap: 8 }}>
          <XStack style={{ alignItems: 'center', gap: 10 }}>
            <Ionicons name="document-text-outline" size={28} color={ios.primary} />
            <Text
              style={{
                flex: 1,
                color: ios.foreground,
                fontSize: 26,
                lineHeight: 32,
                fontWeight: '900',
              }}
            >
              {t('terms.title')}
            </Text>
          </XStack>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 22, fontWeight: '800' }}>
            {t('terms.last_update')}
          </Text>
        </YStack>

        <TermsSection
          titleKey="terms.section1.title"
          paragraphs={['terms.section1.p1', 'terms.section1.p2']}
        />

        <TermsSection
          titleKey="terms.section2.title"
          paragraphs={['terms.section2.intro']}
          list={[
            'terms.section2.list.item1',
            'terms.section2.list.item2',
            'terms.section2.list.item3',
          ]}
          conclusionKey="terms.section2.disclaimer"
        />

        <TermsSection
          titleKey="terms.section3.title"
          paragraphs={['terms.section3.intro']}
          list={[
            'terms.section3.list.item1',
            'terms.section3.list.item2',
          ]}
          conclusionKey="terms.section3.conclusion"
        />

        <TermsSection
          titleKey="terms.section4.title"
          paragraphs={['terms.section4.content']}
        />

        <TermsSection
          titleKey="terms.section5.title"
          paragraphs={['terms.section5.p1', 'terms.section5.p2']}
          list={[
            'terms.section5.list.item1',
            'terms.section5.list.item2',
            'terms.section5.list.item3',
          ]}
        />

        <TermsSection
          titleKey="terms.section6.title"
          paragraphs={['terms.section6.intro']}
          list={[
            'terms.section6.list.item1',
            'terms.section6.list.item2',
          ]}
          conclusionKey="terms.section6.conclusion"
        />

        <TermsSection
          titleKey="terms.section7.title"
          paragraphs={['terms.section7.content']}
        />

        <YStack style={{ gap: 12 }}>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={20} color={ios.primary} />
            <Text
              style={{
                flex: 1,
                color: ios.foreground,
                fontSize: 20,
                lineHeight: 26,
                fontWeight: '800',
              }}
            >
              {t('terms.section8.title')}
            </Text>
          </XStack>
          <Text style={{ color: ios.mutedForeground, fontSize: 15, lineHeight: 22 }}>
            {t('terms.section8.intro')}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '800' }}>
            Matis Gillet
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
