import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

function AcceptInvitePage() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { invitationToken } = route.params || {};

  const acceptInvitation = async () => {
    try {
      // Logique d'acceptation d'invitation
      Alert.alert('Succès', 'Invitation acceptée');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter l\'invitation');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Accepter l'invitation</Text>
        
        <TouchableOpacity style={styles.button} onPress={acceptInvitation}>
          <Text style={styles.buttonText}>Accepter</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#343a40',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AcceptInvitePage;
