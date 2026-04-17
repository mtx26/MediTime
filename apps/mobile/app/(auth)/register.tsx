import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { authService } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    const error = await authService.registerWithEmail(email, password, name);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.error', 'Erreur'), error.message);
    } else {
      Alert.alert(
        t('auth.registrationSuccess', 'Inscription réussie'),
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
        <Text style={styles.title}>{t('auth.register', 'Inscription')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.name', 'Nom')}
          value={name}
          onChangeText={setName}
          textContentType="name"
        />

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
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {t('auth.register', 'Inscription')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('auth.hasAccount', 'Déjà un compte ?')}{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>
                {t('auth.login', 'Connexion')}
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: { color: '#64748b' },
  footerLink: { color: '#4f46e5', fontWeight: '600' },
});
