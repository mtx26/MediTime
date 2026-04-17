import { useState } from 'react';
import {
  View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView,
} from 'react-native';
import {
  Text, TextInput, Button, Card, Divider, IconButton, useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const error = await authService.loginWithEmail(email, password);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.error', 'Erreur'), error.message);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    const error = await authService.loginWithMagicLink(email);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.error', 'Erreur'), error.message);
    } else {
      Alert.alert(
        t('auth.magicLinkSent', 'Lien envoyé'),
        t('auth.checkEmail', 'Vérifiez votre boîte mail.'),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="medkit" size={48} color={theme.colors.primary} />
          <Text variant="headlineMedium" style={[styles.appTitle, { color: theme.colors.primary }]}>
            MediTime
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              {t('auth.login', 'Connexion')}
            </Text>

            <Text variant="bodyMedium" style={styles.socialLabel}>
              {t('auth.login_with', 'Se connecter avec')}
            </Text>
            <View style={styles.socialRow}>
              <IconButton icon="google" mode="outlined" size={28} onPress={() => {}} />
              <IconButton icon="github" mode="outlined" size={28} onPress={() => {}} />
              <IconButton icon="facebook" mode="outlined" size={28} onPress={() => {}} />
              <IconButton icon="microsoft" mode="outlined" size={28} onPress={() => {}} />
            </View>

            <View style={styles.divider}>
              <Divider style={styles.dividerLine} />
              <Text variant="bodySmall" style={styles.dividerText}>
                {t('auth.or_with_email', 'ou par email')}
              </Text>
              <Divider style={styles.dividerLine} />
            </View>

            <TextInput
              label={t('auth.email', 'Email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
            />

            <TextInput
              label={t('auth.password', 'Mot de passe')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              textContentType="password"
              mode="outlined"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="login"
            >
              {t('auth.login', 'Connexion')}
            </Button>

            <Button
              mode="text"
              onPress={handleMagicLink}
              style={styles.magicLink}
              icon="link-variant"
              compact
            >
              {t('auth.magicLink', 'Connexion par lien magique')}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            {t('auth.noAccount', 'Pas de compte ?')}{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Text
              variant="bodyMedium"
              style={[styles.footerLink, { color: theme.colors.primary }]}
            >
              {t('auth.register', 'Inscription')}
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  appTitle: { fontWeight: 'bold', marginTop: 8 },
  card: { borderRadius: 16, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  socialLabel: { textAlign: 'center', color: '#64748b', marginBottom: 8 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1 },
  dividerText: { marginHorizontal: 12, color: '#94a3b8' },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  button: { marginTop: 8, borderRadius: 10 },
  buttonContent: { paddingVertical: 6 },
  magicLink: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#64748b' },
  footerLink: { fontWeight: '600' },
});
