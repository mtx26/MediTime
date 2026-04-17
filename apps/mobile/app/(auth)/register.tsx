import { useState } from 'react';
import {
  View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView,
} from 'react-native';
import {
  Text, TextInput, Button, Card, Checkbox, Divider, IconButton, useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    if (!termsAccepted) {
      Alert.alert(t('auth.error', 'Erreur'), t('auth.accept_terms_required', 'Veuillez accepter les conditions.'));
      return;
    }
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
              {t('auth.register', 'Inscription')}
            </Text>

            <Text variant="bodyMedium" style={styles.socialLabel}>
              {t('auth.register_with', "S'inscrire avec")}
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
              label={t('auth.name', 'Nom')}
              value={name}
              onChangeText={setName}
              textContentType="name"
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />

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
              textContentType="newPassword"
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

            <View style={styles.termsRow}>
              <Checkbox
                status={termsAccepted ? 'checked' : 'unchecked'}
                onPress={() => setTermsAccepted(!termsAccepted)}
                color={theme.colors.primary}
              />
              <Text variant="bodySmall" style={styles.termsText}>
                {t('auth.accept_terms', "J'accepte les conditions d'utilisation")}
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="account-plus"
            >
              {t('auth.register', 'Inscription')}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            {t('auth.hasAccount', 'Déjà un compte ?')}{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Text
              variant="bodyMedium"
              style={[styles.footerLink, { color: theme.colors.primary }]}
            >
              {t('auth.login', 'Connexion')}
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
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  termsText: { flex: 1, color: '#64748b' },
  button: { marginTop: 8, borderRadius: 10 },
  buttonContent: { paddingVertical: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#64748b' },
  footerLink: { fontWeight: '600' },
});
