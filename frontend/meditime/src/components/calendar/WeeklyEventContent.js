import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const getTimeString = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
};

const formatDose = (dose) => {
  if (dose === 0.25) return '0.25';
  if (dose === 0.5) return '0.50';
  if (dose === 0.75) return '0.75';
  return dose ? dose.toFixed(2) : '0';
};

export default function WeeklyEventContent({
  events = [],
  selectedDate,
  onEventPress,
  onEventLongPress,
  style,
}) {
  const { t } = useTranslation();

  // Filtrer les événements pour la date sélectionnée
  const dayEvents = events.filter(event => {
    if (!event.date || !selectedDate) return false;
    return event.date.startsWith(selectedDate);
  });

  // Grouper les événements par heure
  const eventsByTime = dayEvents.reduce((acc, event) => {
    const time = getTimeString(event.date);
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(event);
    return acc;
  }, {});

  // Trier les heures
  const sortedTimes = Object.keys(eventsByTime).sort();

  const handleEventPress = (event) => {
    if (onEventPress) {
      onEventPress(event);
    }
  };

  const handleEventLongPress = (event) => {
    if (onEventLongPress) {
      onEventLongPress(event);
    }
  };

  if (dayEvents.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {t('calendar.no_medicines_scheduled')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('calendar.add_medicine_to_start')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {sortedTimes.map((time, timeIndex) => (
          <View key={timeIndex} style={styles.timeGroup}>
            {/* En-tête de l'heure */}
            <View style={styles.timeHeader}>
              <Text style={styles.timeText}>{time}</Text>
              <View style={styles.timeLine} />
            </View>

            {/* Événements à cette heure */}
            <View style={styles.eventsContainer}>
              {eventsByTime[time].map((event, eventIndex) => (
                <TouchableOpacity
                  key={eventIndex}
                  style={[
                    styles.eventCard,
                    event.is_taken && styles.eventCardTaken,
                  ]}
                  onPress={() => handleEventPress(event)}
                  onLongPress={() => handleEventLongPress(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text 
                        style={[
                          styles.medicineName,
                          event.is_taken && styles.medicineNameTaken,
                        ]}
                        numberOfLines={2}
                      >
                        {event.medicine_name}
                      </Text>
                      
                      {event.is_taken && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color="#28a745" 
                        />
                      )}
                    </View>

                    <View style={styles.eventDetails}>
                      <View style={styles.doseContainer}>
                        <Ionicons name="medical" size={14} color="#666" />
                        <Text style={styles.doseText}>
                          {formatDose(event.dose)} {event.unit || 'cp'}
                        </Text>
                      </View>

                      {event.note && (
                        <View style={styles.noteContainer}>
                          <Ionicons name="document-text" size={14} color="#666" />
                          <Text style={styles.noteText} numberOfLines={1}>
                            {event.note}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Indicateur de statut */}
                    <View style={[
                      styles.statusIndicator,
                      event.is_taken 
                        ? styles.statusIndicatorTaken 
                        : styles.statusIndicatorPending
                    ]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  timeGroup: {
    marginBottom: 24,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
  },
  timeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  eventsContainer: {
    gap: 8,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCardTaken: {
    backgroundColor: '#f8f9fa',
    borderColor: '#28a745',
    opacity: 0.8,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  medicineNameTaken: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  eventDetails: {
    gap: 4,
  },
  doseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doseText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusIndicatorTaken: {
    backgroundColor: '#28a745',
  },
  statusIndicatorPending: {
    backgroundColor: '#ffc107',
  },
});
