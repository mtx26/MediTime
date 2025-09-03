import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

function VerifyEmail() {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const { token, email } = route.params || {};

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    } else {
      setVerifying(false);
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      // Appel API pour vérifier le token d'email
      // const result = await authService.verifyEmail(token);
      
      setVerified(true);
      setVerifying(false);
      
      Alert.alert(
        'Email vérifié',
        'Votre email a été vérifié avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setVerifying(false);
      Alert.alert(
        'Erreur',
        'Le lien de vérification est invalide ou expiré'
      );
    }
  };

  const resendVerification = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Adresse email manquante');
      return;
    }

    setLoading(true);

    try {
      // Appel API pour renvoyer l'email de vérification
      // await authService.resendVerificationEmail(email);
      
      Alert.alert(
        'Email envoyé',
        'Un nouvel email de vérification a été envoyé'
      );
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
      Alert.alert(
        'Erreur',
        'Impossible de renvoyer l\'email de vérification'
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Vérification de votre email...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {verified ? 'Email vérifié !' : 'Vérification d\'email'}
        </Text>
        
        {verified ? (
          <>
            <Text style={styles.subtitle}>
              Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Cliquez sur le lien dans l'email que nous vous avons envoyé pour vérifier votre compte.
            </Text>
            
            {email && (
              <Text style={styles.emailText}>
                Email envoyé à : {email}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={resendVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Renvoyer l'email</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Retour à la connexion</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#343a40',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6c757d',
    lineHeight: 24,
  },
  emailText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#495057',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default VerifyEmail;
