import React, { useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';

function AuthCallback() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    // Gérer le callback d'authentification
    const handleAuthCallback = async () => {
      try {
        // Traitement du callback d'authentification (OAuth, etc.)
        const { token, user } = route.params || {};
        
        if (token && user) {
          // Sauvegarder les informations d'authentification
          // await authService.saveAuthToken(token);
          // await authService.saveUserInfo(user);
          
          // Rediriger vers l'application
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          // Erreur d'authentification
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      } catch (error) {
        console.error('Erreur dans AuthCallback:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    };

    handleAuthCallback();
  }, [navigation, route.params]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Finalisation de la connexion...
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default AuthCallback;
