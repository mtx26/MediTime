import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';

function SharedListScreen({ navigation: navProp, sharedProps }) {
  const navigation = navProp || useNavigation();
  const { userInfo } = useContext(UserContext);
  
  const [refreshing, setRefreshing] = useState(false);
  const [sharedCalendars, setSharedCalendars] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    loadSharedCalendars();
  }, []);

  const loadSharedCalendars = async () => {
    try {
      // Ici vous chargerez les calendriers partagés depuis l'API
      // const shared = await sharedCalendarService.getSharedCalendars();
      // const invitations = await invitationService.getPendingInvitations();
      
      // Données simulées pour l'instant
      setSharedCalendars([
        {
          id: '1',
          name: 'Médicaments de Papa',
          owner: 'Jean Dupont',
          ownerEmail: 'jean.dupont@email.com',
          color: '#34C759',
          permissions: 'read',
          medicinesCount: 5,
          lastUpdate: '2024-01-15',
        },
        {
          id: '2',
          name: 'Pilulier familial',
          owner: 'Marie Martin',
          ownerEmail: 'marie.martin@email.com',
          color: '#FF9500',
          permissions: 'write',
          medicinesCount: 8,
          lastUpdate: '2024-01-14',
        }
      ]);

      setPendingInvitations([
        {
          id: '1',
          calendarName: 'Traitement de Lisa',
          inviter: 'Lisa Durand',
          inviterEmail: 'lisa.durand@email.com',
          sentDate: '2024-01-16',
          permissions: 'read',
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des calendriers partagés:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSharedCalendars();
    setRefreshing(false);
  };

  const handleCalendarPress = (calendar) => {
    navigation.navigate('CalendarView', { 
      calendarId: calendar.id,
      isShared: true,
      calendarName: calendar.name,
      permissions: calendar.permissions
    });
  };

  const handleAcceptInvitation = async (invitation) => {
    try {
      // await invitationService.acceptInvitation(invitation.id);
      Alert.alert('Succès', 'Invitation acceptée');
      await loadSharedCalendars();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter l\'invitation');
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    Alert.alert(
      'Refuser l\'invitation',
      `Êtes-vous sûr de vouloir refuser l'invitation pour "${invitation.calendarName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Refuser', 
          style: 'destructive',
          onPress: async () => {
            try {
              // await invitationService.declineInvitation(invitation.id);
              Alert.alert('Invitation refusée');
              await loadSharedCalendars();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de refuser l\'invitation');
            }
          }
        }
      ]
    );
  };

  const handleLeaveCalendar = async (calendar) => {
    Alert.alert(
      'Quitter le calendrier',
      `Êtes-vous sûr de vouloir quitter "${calendar.name}" ? Vous perdrez l'accès à ce calendrier.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: async () => {
            try {
              // await sharedCalendarService.leaveCalendar(calendar.id);
              Alert.alert('Succès', 'Vous avez quitté le calendrier');
              await loadSharedCalendars();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de quitter le calendrier');
            }
          }
        }
      ]
    );
  };

  const getPermissionText = (permission) => {
    switch (permission) {
      case 'read': return 'Lecture seule';
      case 'write': return 'Lecture et écriture';
      case 'admin': return 'Administrateur';
      default: return 'Inconnu';
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'read': return '#6c757d';
      case 'write': return '#007AFF';
      case 'admin': return '#34C759';
      default: return '#6c757d';
    }
  };

  const renderSharedCalendar = ({ item: calendar }) => (
    <TouchableOpacity
      style={styles.calendarCard}
      onPress={() => handleCalendarPress(calendar)}
      onLongPress={() => handleLeaveCalendar(calendar)}
    >
      <View style={styles.calendarHeader}>
        <View style={styles.calendarInfo}>
          <View style={[styles.colorIndicator, { backgroundColor: calendar.color }]} />
          <View style={styles.calendarText}>
            <Text style={styles.calendarName}>{calendar.name}</Text>
            <Text style={styles.calendarOwner}>Par {calendar.owner}</Text>
          </View>
        </View>
        <View style={styles.calendarMeta}>
          <View style={[styles.permissionBadge, { backgroundColor: getPermissionColor(calendar.permissions) }]}>
            <Text style={styles.permissionText}>{getPermissionText(calendar.permissions)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.calendarStats}>
        <View style={styles.stat}>
          <Ionicons name="medical" size={16} color="#6c757d" />
          <Text style={styles.statText}>{calendar.medicinesCount} médicaments</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time" size={16} color="#6c757d" />
          <Text style={styles.statText}>Mis à jour le {calendar.lastUpdate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInvitation = ({ item: invitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.invitationIcon}>
          <Ionicons name="mail" size={24} color="#007AFF" />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationTitle}>Invitation à "{invitation.calendarName}"</Text>
          <Text style={styles.invitationSubtitle}>
            De {invitation.inviter} ({invitation.inviterEmail})
          </Text>
          <Text style={styles.invitationDate}>Reçue le {invitation.sentDate}</Text>
        </View>
      </View>
      
      <View style={styles.invitationActions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineInvitation(invitation)}
        >
          <Text style={styles.declineText}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptInvitation(invitation)}
        >
          <Text style={styles.acceptText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Calendriers partagés</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Invitations en attente ({pendingInvitations.length})
            </Text>
            <FlatList
              data={pendingInvitations}
              renderItem={renderInvitation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Calendriers partagés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Calendriers partagés avec moi ({sharedCalendars.length})
          </Text>
          
          {sharedCalendars.length > 0 ? (
            <FlatList
              data={sharedCalendars}
              renderItem={renderSharedCalendar}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#6c757d" />
              <Text style={styles.emptyTitle}>Aucun calendrier partagé</Text>
              <Text style={styles.emptySubtitle}>
                Demandez à vos proches de partager leurs calendriers avec vous
              </Text>
            </View>
          )}
        </View>

        {/* Aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          <View style={styles.helpCard}>
            <View style={styles.helpItem}>
              <Ionicons name="share" size={20} color="#007AFF" />
              <Text style={styles.helpText}>
                Demandez à vos proches de partager leurs calendriers avec votre adresse email
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="eye" size={20} color="#34C759" />
              <Text style={styles.helpText}>
                Consultez leurs médicaments et rappels en temps réel
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="notifications" size={20} color="#FF9500" />
              <Text style={styles.helpText}>
                Recevez des notifications en cas d'oubli ou de stock faible
              </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  calendarCard: {
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  calendarOwner: {
    fontSize: 14,
    color: '#6c757d',
  },
  calendarMeta: {
    alignItems: 'flex-end',
  },
  permissionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  permissionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  calendarStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  invitationSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  declineText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  acceptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default SharedListScreen;
