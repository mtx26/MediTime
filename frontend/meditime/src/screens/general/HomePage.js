import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../contexts/UserContext';

function HomeScreen({ navigation, sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const { calendarsData, notificationsData } = sharedProps.personalCalendars;

  const unreadNotificationsCount = notificationsData?.filter(n => !n.read).length || 0;
  const calendarsCount = calendarsData?.length || 0;

  const quickActions = [
    {
      title: 'Mes Calendriers',
      subtitle: `${calendarsCount} calendrier${calendarsCount > 1 ? 's' : ''}`,
      icon: 'calendar',
      onPress: () => navigation.navigate('Calendars'),
      color: '#007AFF',
    },
    {
      title: 'Scanner',
      subtitle: 'Analyser une ordonnance',
      icon: 'camera',
      onPress: () => navigation.navigate('Scanner'),
      color: '#34C759',
    },
    {
      title: 'Notifications',
      subtitle: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} non lue${unreadNotificationsCount > 1 ? 's' : ''}` : 'Aucune notification',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications'),
      color: '#FF9500',
      badge: unreadNotificationsCount,
    },
    {
      title: 'Paramètres',
      subtitle: 'Configuration',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
      color: '#8E8E93',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.userName}>
            {userInfo?.displayName || userInfo?.email || 'Utilisateur'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="white" />
                  {action.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          <View style={styles.todayCard}>
            <Ionicons name="today" size={20} color="#007AFF" />
            <Text style={styles.todayText}>
              Aucun médicament prévu pour aujourd'hui
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todayText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
});

export default HomeScreen;
