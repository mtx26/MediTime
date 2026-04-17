import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { authService } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <View style={styles.inner}>
        <Text style={styles.title}>{t('auth.login', 'Connexion')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email', 'Email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.password', 'Mot de passe')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.login', 'Connexion')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleMagicLink}>
          <Text style={styles.linkText}>
            {t('auth.magicLink', 'Connexion par lien magique')}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or', 'ou')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('auth.noAccount', 'Pas de compte ?')}{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>
                {t('auth.register', 'Inscription')}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#4f46e5', fontSize: 14 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 12, color: '#94a3b8', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: '#64748b' },
  footerLink: { color: '#4f46e5', fontWeight: '600' },
});
