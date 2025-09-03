import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

function CalendarSettings() {
  const { t } = useTranslation();
  const route = useRoute();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(undefined);

  const { calendarId } = route.params || {};

  const modifyStockDecrementMethod = async (method) => {
    try {
      // const rep = await personalCalendars.updatePersonalStockDecrementMethod(calendarId, method);
      // if (rep.success) {
        setSelectedMethod(method);
        Alert.alert('Succès', 'Méthode de décompte mise à jour');
      // }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la méthode de décompte');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(undefined);
      try {
        // const rep = await personalCalendars.fetchPersonalStockDecrementMethod(calendarId);
        // if (rep.success) {
        //   setSelectedMethod(rep.method);
        //   setLoading(false);
        // } else {
        //   setLoading(true);
        // }
        
        // Valeur par défaut pour la démo
        setSelectedMethod('weekly_pillbox');
        setLoading(false);
      } catch (error) {
        setLoading(true);
      }
    };
    initialize();
  }, [calendarId]);

  if (loading === undefined && calendarId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('loading_calendar')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && calendarId) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('calendar_settings.stock.label')}</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              selectedMethod === 'weekly_pillbox' && styles.radioOptionSelected,
            ]}
            onPress={() => modifyStockDecrementMethod('weekly_pillbox')}
          >
            <View style={styles.radioButton}>
              <View style={[
                styles.radioInner,
                selectedMethod === 'weekly_pillbox' && styles.radioInnerSelected,
              ]} />
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>
                {t('calendar_settings.stock.weekly.label')}
              </Text>
              <Text style={styles.radioDescription}>
                {t('calendar_settings.stock.weekly.description')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              selectedMethod === 'daily_midnight' && styles.radioOptionSelected,
            ]}
            onPress={() => modifyStockDecrementMethod('daily_midnight')}
          >
            <View style={styles.radioButton}>
              <View style={[
                styles.radioInner,
                selectedMethod === 'daily_midnight' && styles.radioInnerSelected,
              ]} />
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>
                {t('calendar_settings.stock.daily.label')}
              </Text>
              <Text style={styles.radioDescription}>
                {t('calendar_settings.stock.daily.description')}
              </Text>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#343a40',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
  },
  radioOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e7f3ff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: '#007AFF',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 5,
  },
  radioDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
});

export default CalendarSettings;
