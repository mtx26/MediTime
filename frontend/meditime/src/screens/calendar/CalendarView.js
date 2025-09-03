import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  WeekCalendarSelector,
  WeeklyEventContent,
  PillboxDisplay,
} from '../components/calendar';

export default function CalendarScreen({ route }) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Récupérer les paramètres de route
  const { calendarId, type = 'personal' } = route?.params || {};

  useEffect(() => {
    loadSchedule();
  }, [selectedDate, calendarId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des données
      // Ici vous intégreriez avec votre API
      const mockSchedule = [
        {
          id: '1',
          medicine_name: 'Paracétamol',
          dose: 1,
          unit: 'cp',
          date: selectedDate + 'T08:00:00Z',
          is_taken: false,
          note: 'Avec un verre d\'eau',
        },
        {
          id: '2',
          medicine_name: 'Aspirine',
          dose: 0.5,
          unit: 'cp',
          date: selectedDate + 'T12:00:00Z',
          is_taken: true,
        },
        {
          id: '3',
          medicine_name: 'Vitamine D',
          dose: 1,
          unit: 'gélule',
          date: selectedDate + 'T20:00:00Z',
          is_taken: false,
        },
      ];
      
      setSchedule(mockSchedule);
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleWeekChange = (date) => {
    // Optionnel: logique supplémentaire lors du changement de semaine
    console.log('Semaine changée:', date);
  };

  const handleEventPress = (event) => {
    console.log('Événement sélectionné:', event);
    // Ici vous pourriez naviguer vers les détails de l'événement
    // navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleEventLongPress = (event) => {
    console.log('Appui long sur événement:', event);
    // Ici vous pourriez afficher un menu contextuel
  };

  const handleUseMedicines = async () => {
    try {
      // Marquer les médicaments comme pris
      const updatedSchedule = schedule.map(item => ({
        ...item,
        is_taken: !item.is_taken,
      }));
      setSchedule(updatedSchedule);
      
      // Ici vous synchroniseriez avec votre API
      console.log('Médicaments marqués comme pris');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sélecteur de semaine */}
      <WeekCalendarSelector
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onWeekChange={handleWeekChange}
        schedule={schedule}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Vue des événements de la journée */}
        <WeeklyEventContent
          events={schedule}
          selectedDate={selectedDate}
          onEventPress={handleEventPress}
          onEventLongPress={handleEventLongPress}
          style={styles.eventsSection}
        />

        {/* Vue pillulier (optionnelle) */}
        {type === 'personal' && (
          <View style={styles.pillboxSection}>
            <PillboxDisplay
              type={type}
              monday={selectedDate}
              calendarId={calendarId}
              schedule={schedule}
              onUseMedicines={handleUseMedicines}
            />
          </View>
        )}
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
  },
  eventsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillboxSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
