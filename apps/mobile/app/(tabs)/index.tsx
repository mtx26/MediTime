import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userInfo } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediTime</Text>
      <Text style={styles.subtitle}>
        {t('home.welcome', 'Bienvenue sur MediTime')}
      </Text>
      {userInfo?.email && (
        <Text style={styles.email}>{userInfo.email}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 16,
  },
});
