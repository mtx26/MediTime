import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Input, Button, H2, Text, Separator } from 'tamagui';
import { Mail, Lock, User, Eye, EyeOff } from '@tamagui/lucide-icons';
import { authService } from '../../src/contexts/AuthContext';
import { useIosTheme } from '../../src/theme/ios';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const err = await authService.registerWithEmail(email, password, name);
      if (err) {
        const code = (err as { code?: string }).code ?? 'unexpected_error';
        setError(t(`supabase-error.${code}`));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <YStack flex={1} gap="$4" style={{ justifyContent: 'center', padding: 20, backgroundColor: ios.background }}>
        <H2 style={{ textAlign: 'center' }} color="$color">
          {t('auth.verification_sent')}
        </H2>
        <Text style={{ textAlign: 'center' }} color="$gray10" fontSize="$4">
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
      <YStack flex={1} gap="$4" style={{ justifyContent: 'center', padding: 20, backgroundColor: ios.background }}>
        <H2 style={{ textAlign: 'center' }} color="$color">
          {t('auth.register')}
        </H2>

        {error && (
          <Text color="$red10" style={{ textAlign: 'center' }} fontSize="$3">
            {error}
          </Text>
        )}

        <YStack gap="$3">
          <XStack style={{ alignItems: 'center' }} gap="$2">
            <User size={20} color="$gray10" />
            <Input
              flex={1}
              size="$4"
              placeholder={t('auth.name')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </XStack>

          <XStack style={{ alignItems: 'center' }} gap="$2">
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

          <XStack style={{ alignItems: 'center' }} gap="$2">
            <Lock size={20} color="$gray10" />
            <Input
              flex={1}
              size="$4"
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoComplete="new-password"
            />
            <Button
              size="$3"
              chromeless
              icon={passwordVisible ? EyeOff : Eye}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          </XStack>
        </YStack>

        <Button
          size="$4"
          theme="blue"
          onPress={handleRegister}
          disabled={loading || !email || !password || !name}
          opacity={loading ? 0.7 : 1}
        >
          {loading ? t('loading') : t('auth.register')}
        </Button>

        <Separator my="$2" />

        <XStack style={{ justifyContent: 'center', alignItems: 'center' }} gap="$2">
          <Text color="$gray10" fontSize="$3">
            {t('auth.already_have_account')}
          </Text>
          <Button
            size="$3"
            chromeless
            onPress={() => router.push('/(auth)/login')}
          >
            <Text color="$blue10" fontWeight="bold" fontSize="$3">
              {t('auth.login')}
            </Text>
          </Button>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
