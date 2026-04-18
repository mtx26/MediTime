import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Input, Button, H2, Text } from 'tamagui';
import { Mail } from '@tamagui/lucide-icons';
import { authService } from '../../src/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor="$background" gap="$4">
        <H2 textAlign="center" color="$color">
          {t('auth.reset_email_sent')}
        </H2>
        <Text textAlign="center" color="$gray10" fontSize="$4">
          {t('auth.check_email')}
        </Text>
        <Button
          size="$4"
          theme="blue"
          onPress={() => router.replace('/(auth)/login')}
        >
          {t('auth.back_to_login')}
        </Button>
      </YStack>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor="$background" gap="$4">
        <H2 textAlign="center" color="$color">
          {t('auth.forgot_password')}
        </H2>

        <Text textAlign="center" color="$gray10" fontSize="$3">
          {t('auth.reset_password_instructions')}
        </Text>

        <XStack alignItems="center" gap="$2">
          <Mail size={20} color="$gray10" />
          <Input
            flex={1}
            size="$4"
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </XStack>

        <Button
          size="$4"
          theme="blue"
          onPress={handleReset}
          disabled={loading || !email}
          opacity={loading ? 0.7 : 1}
        >
          {loading ? t('common.loading') : t('auth.send_reset_link')}
        </Button>

        <Button
          size="$3"
          chromeless
          onPress={() => router.back()}
        >
          <Text color="$blue10" fontSize="$3">
            {t('auth.back_to_login')}
          </Text>
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}
