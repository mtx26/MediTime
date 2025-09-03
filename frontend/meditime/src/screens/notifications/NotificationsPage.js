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
import { AlertSystem } from '../components/common';

function NotificationsScreen({ navigation, sharedProps }) {
  const { notificationsData, readNotification } = sharedProps.notifications;

  const urgentNotifications = notificationsData?.filter(n => n.priority === 'urgent' && !n.read) || [];

  const handleMarkAsRead = async (notificationId) => {
    try {
      await readNotification(notificationId);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Alertes urgentes */}
        {urgentNotifications.length > 0 && (
          <AlertSystem
            type="warning"
            title="Notifications urgentes"
            message={`${urgentNotifications.length} notification${urgentNotifications.length > 1 ? 's' : ''} urgente${urgentNotifications.length > 1 ? 's' : ''} non lue${urgentNotifications.length > 1 ? 's' : ''}`}
            actions={[
              {
                title: 'Voir',
                onPress: () => {
                  // Scroll vers la première notification urgente
                  const firstUrgent = urgentNotifications[0];
                  if (firstUrgent) {
                    handleMarkAsRead(firstUrgent.id);
                  }
                }
              }
            ]}
          />
        )}

        {notificationsData && notificationsData.length > 0 ? (
          notificationsData.map((notification, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotification
              ]}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <Ionicons 
                  name={notification.read ? "checkmark-circle" : "time"} 
                  size={20} 
                  color={notification.read ? "#34C759" : "#FF9500"} 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous recevrez ici vos rappels de médicaments
            </Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationIcon: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#adb5bd',
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
  },
});

export default NotificationsScreen;
