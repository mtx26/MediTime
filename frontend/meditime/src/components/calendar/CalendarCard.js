import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function CalendarCard({ calendar, onPress, onSettings }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{calendar.name}</Text>
          <Text style={styles.subtitle}>
            {calendar.medicines_count || 0} médicaments
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={(e) => {
            e.stopPropagation();
            onSettings?.();
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#007AFF" />
          <Text style={styles.infoText}>
            Créé le {new Date(calendar.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {calendar.last_activity && (
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Dernière activité: {new Date(calendar.last_activity).toLocaleDateString()}
            </Text>
          </View>
        )}
        
        {calendar.shared_users_count > 0 && (
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              Partagé avec {calendar.shared_users_count} personne(s)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {calendar.has_low_stock && (
          <View style={styles.badge}>
            <Ionicons name="warning" size={14} color="#FF9500" />
            <Text style={styles.badgeText}>Stock faible</Text>
          </View>
        )}
        
        {calendar.has_upcoming_doses && (
          <View style={[styles.badge, styles.reminderBadge]}>
            <Ionicons name="alarm" size={14} color="#007AFF" />
            <Text style={styles.badgeText}>Prochaines prises</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 4,
  },
  info: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reminderBadge: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default CalendarCard;
