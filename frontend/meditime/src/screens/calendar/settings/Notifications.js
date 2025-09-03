import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function NotificationSettings() {
  const [settings, setSettings] = useState({
    medicineReminders: true,
    appointmentReminders: true,
    sharedCalendarUpdates: true,
    dailySummary: false,
    weeklyReport: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // Charger les paramètres de notifications depuis l'API
      // const userSettings = await notificationService.getSettings();
      // setSettings(userSettings);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Sauvegarder les paramètres
      // await notificationService.updateSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    }
  };

  const testNotification = () => {
    Alert.alert(
      'Test de notification',
      'Si les notifications sont activées, vous devriez recevoir une notification de test.',
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Envoyer une notification de test
              // await notificationService.sendTestNotification();
            } catch (error) {
              console.error('Erreur lors du test:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Paramètres de notifications</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types de notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rappels de médicaments</Text>
            <Switch
              value={settings.medicineReminders}
              onValueChange={(value) => updateSetting('medicineReminders', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rappels de rendez-vous</Text>
            <Switch
              value={settings.appointmentReminders}
              onValueChange={(value) => updateSetting('appointmentReminders', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mises à jour du calendrier partagé</Text>
            <Switch
              value={settings.sharedCalendarUpdates}
              onValueChange={(value) => updateSetting('sharedCalendarUpdates', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Résumé quotidien</Text>
            <Switch
              value={settings.dailySummary}
              onValueChange={(value) => updateSetting('dailySummary', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rapport hebdomadaire</Text>
            <Switch
              value={settings.weeklyReport}
              onValueChange={(value) => updateSetting('weeklyReport', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comportement</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Son activé</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibration activée</Text>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mode silencieux programmé</Text>
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
            />
          </View>

          {settings.quietHoursEnabled && (
            <View style={styles.quietHoursContainer}>
              <Text style={styles.quietHoursText}>
                Heures silencieuses : {settings.quietHoursStart} - {settings.quietHoursEnd}
              </Text>
              <TouchableOpacity
                style={styles.editTimeButton}
                onPress={() => {
                  Alert.alert(
                    'Modifier les heures',
                    'Fonctionnalité de sélection d\'heure à implémenter'
                  );
                }}
              >
                <Text style={styles.editTimeButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test et diagnostic</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotification}
          >
            <Text style={styles.testButtonText}>Tester les notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionsButton}
            onPress={() => {
              Alert.alert(
                'Permissions',
                'Vérifiez que les notifications sont autorisées dans les paramètres de votre appareil.'
              );
            }}
          >
            <Text style={styles.permissionsButtonText}>Vérifier les permissions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => {
              Alert.alert(
                'Réinitialiser',
                'Êtes-vous sûr de vouloir réinitialiser tous les paramètres de notifications ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Réinitialiser',
                    style: 'destructive',
                    onPress: () => {
                      setSettings({
                        medicineReminders: true,
                        appointmentReminders: true,
                        sharedCalendarUpdates: true,
                        dailySummary: false,
                        weeklyReport: false,
                        soundEnabled: true,
                        vibrationEnabled: true,
                        quietHoursEnabled: false,
                        quietHoursStart: '22:00',
                        quietHoursEnd: '08:00',
                      });
                    },
                  },
                ]
              );
            }}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Réinitialiser les paramètres
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#343a40',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#495057',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  quietHoursContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quietHoursText: {
    fontSize: 14,
    color: '#6c757d',
  },
  editTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  editTimeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionsButton: {
    backgroundColor: '#17a2b8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#fff',
  },
});

export default NotificationSettings;
