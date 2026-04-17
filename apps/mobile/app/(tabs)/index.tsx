import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Avatar, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const theme = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="medkit" size={48} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.appTitle, { color: theme.colors.primary }]}>
          MediTime
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('home.welcome', 'Bienvenue sur MediTime')}
        </Text>
        {userInfo?.email && (
          <Text variant="bodySmall" style={styles.email}>{userInfo.email}</Text>
        )}
      </View>

      <View style={styles.features}>
        <Card style={styles.featureCard} mode="elevated">
          <Card.Content style={styles.featureContent}>
            <Avatar.Icon size={48} icon="calendar" style={{ backgroundColor: theme.colors.primaryContainer }} />
            <Text variant="titleMedium" style={styles.featureTitle}>
              {t('features.title1', 'Calendrier')}
            </Text>
            <Text variant="bodySmall" style={styles.featureDesc}>
              {t('features.desc1', 'Gérez vos prises de médicaments')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard} mode="elevated">
          <Card.Content style={styles.featureContent}>
            <Avatar.Icon size={48} icon="account-group" style={{ backgroundColor: theme.colors.primaryContainer }} />
            <Text variant="titleMedium" style={styles.featureTitle}>
              {t('features.title2', 'Partage')}
            </Text>
            <Text variant="bodySmall" style={styles.featureDesc}>
              {t('features.desc2', 'Partagez avec vos proches')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard} mode="elevated">
          <Card.Content style={styles.featureContent}>
            <Avatar.Icon size={48} icon="shield-lock" style={{ backgroundColor: theme.colors.primaryContainer }} />
            <Text variant="titleMedium" style={styles.featureTitle}>
              {t('features.title3', 'Sécurité')}
            </Text>
            <Text variant="bodySmall" style={styles.featureDesc}>
              {t('features.desc3', 'Données protégées')}
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 32 },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  appTitle: { fontWeight: 'bold', marginTop: 8 },
  subtitle: { color: '#64748b', marginTop: 4, textAlign: 'center' },
  email: { color: '#94a3b8', marginTop: 8 },
  features: { paddingHorizontal: 20, gap: 12 },
  featureCard: { borderRadius: 16, backgroundColor: '#fff' },
  featureContent: { alignItems: 'center', paddingVertical: 20 },
  featureTitle: { fontWeight: '600', marginTop: 12 },
  featureDesc: { color: '#64748b', textAlign: 'center', marginTop: 4 },
});
