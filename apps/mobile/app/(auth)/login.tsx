import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Input, Button, H2, Text, Separator } from 'tamagui';
import { Mail, Lock, Eye, EyeOff } from '@tamagui/lucide-icons';
import { authService } from '../../src/contexts/AuthContext';
import { useIosTheme } from '../../src/theme/ios';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const err = await authService.loginWithEmail(email, password);
      if (err) {
        const code = (err as { code?: string }).code ?? 'unexpected_error';
        setError(t(`supabase-error.${code}`));
      }
    } catch {
      setError(t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <YStack flex={1} gap="$4" style={{ justifyContent: 'center', padding: 20, backgroundColor: ios.background }}>
        <H2 style={{ textAlign: 'center' }} color="$color">
          {t('auth.login')}
        </H2>

        {error && (
          <Text color="$red10" style={{ textAlign: 'center' }} fontSize="$3">
            {error}
          </Text>
        )}

        <YStack gap="$3">
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
              autoComplete="password"
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
          onPress={handleLogin}
          disabled={loading || !email || !password}
          opacity={loading ? 0.7 : 1}
        >
          {loading ? t('loading') : t('auth.login')}
        </Button>

        <Button
          size="$3"
          chromeless
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text color="$blue10" fontSize="$3">
            {t('auth.forgot_password')}
          </Text>
        </Button>

        <Separator my="$2" />

        <XStack style={{ justifyContent: 'center', alignItems: 'center' }} gap="$2">
          <Text color="$gray10" fontSize="$3">
            {t('auth.no_account')}
          </Text>
          <Button
            size="$3"
            chromeless
            onPress={() => router.push('/(auth)/register')}
          >
            <Text color="$blue10" fontWeight="bold" fontSize="$3">
              {t('auth.register')}
            </Text>
          </Button>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
