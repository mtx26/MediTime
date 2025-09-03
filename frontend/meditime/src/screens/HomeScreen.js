import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>Utilisateur</Text>
        </View>

        {/* Prochaine prise */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Prochaine prise</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Dans 2h</Text>
            </View>
          </View>
          
          <View style={styles.medicationCard}>
            <Text style={styles.medicationName}>Doliprane 1000mg</Text>
            <Text style={styles.medicationTime}>14:30</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => console.log('Prise effectuée')}
            >
              <Text style={styles.buttonText}>Prise effectuée</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions rapides</Text>
          
          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="medical" size={20} color="#007AFF" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>Mes médicaments</Text>
              <Text style={styles.listSubtitle}>5 médicaments actifs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="calendar" size={20} color="#34C759" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>Calendrier</Text>
              <Text style={styles.listSubtitle}>Voir la planification</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications" size={20} color="#FF9500" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>Notifications</Text>
              <Text style={styles.listSubtitle}>3 rappels en attente</Text>
            </View>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Observance</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34C759' }]}>12</Text>
              <Text style={styles.statLabel}>Prises cette{'\n'}semaine</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000',
  },
  userName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  medicationCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  medicationTime: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
  },
  listSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 44,
  },
  notificationBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
});
