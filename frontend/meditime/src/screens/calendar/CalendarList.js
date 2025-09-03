import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CalendarCard } from '../components/calendar';

function CalendarsScreen({ navigation, sharedProps }) {
  const { calendarsData, addCalendar } = sharedProps.personalCalendars;

  const handleAddCalendar = () => {
    // Navigation vers l'écran d'ajout de calendrier
    // ou modal pour créer un nouveau calendrier
  };

  const handleCalendarPress = (calendar) => {
    navigation.navigate('Calendar', { 
      calendarId: calendar.id,
      calendarName: calendar.name 
    });
  };

  const handleCalendarSettings = (calendar) => {
    // Navigation vers les paramètres du calendrier
    console.log('Settings for calendar:', calendar.name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Calendriers</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCalendar}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {calendarsData && calendarsData.length > 0 ? (
          calendarsData.map((calendar, index) => (
            <CalendarCard
              key={calendar.id || index}
              calendar={{
                ...calendar,
                medicines_count: calendar.medicineCount || 0,
                created_at: calendar.created_at || new Date().toISOString()
              }}
              onPress={() => handleCalendarPress(calendar)}
              onSettings={() => handleCalendarSettings(calendar)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>Aucun calendrier</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre premier calendrier de médicaments
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleAddCalendar}>
              <Text style={styles.createButtonText}>Créer un calendrier</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  calendarDetails: {
    fontSize: 14,
    color: '#6c757d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalendarsScreen;
