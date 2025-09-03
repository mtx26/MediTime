import React, { useState, useEffect, useContext } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../contexts/UserContext';
// import AlertSystem from '../../components/common/AlertSystem';
// import { log } from '../../utils/logger';
// import { getValidRedirect } from '../../utils/redirect';
import {
  GoogleHandleLogin,
  registerWithEmail,
  loginWithEmail,
  GithubHandleLogin,
  TwitterHandleLogin,
  DiscordHandleLogin,
  FacebookHandleLogin,
  MicrosoftHandleLogin
} from '../../services/auth/authService';

function Auth() {
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  
  // 👤 Authentification utilisateur
  const [email, setEmail] = useState(''); // État pour l'adresse e-mail
  const [password, setPassword] = useState(''); // État pour le mot de passe
  const [name, setName] = useState(''); // État pour le nom d'utilisateur
  const [passwordVisible, setPasswordVisible] = useState(false); // État pour l'affichage du mot de passe
  const [activeTab, setActiveTab] = useState('login'); // État pour l'onglet actif (login/register)

  // ⚠️ Alertes
  const [alertMessage, setAlertMessage] = useState(null); // État pour le message d'alerte
  const [alertType, setAlertType] = useState('info'); // État pour le type d'alerte (par défaut : info)
  const [duration, setDuration] = useState(2000); // État pour la durée de l'alerte

  const [redirect, setRedirect] = useState();
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  useEffect(() => {
    const { screen } = route.params || {};
    setActiveTab(screen === 'register' ? 'register' : 'login');
    // setRedirect(getValidRedirect(route.params?.redirect));
  }, [route.params]);

  const switchTab = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const handleLogin = async () => {
    const error = await loginWithEmail(email, password);
    if (error) {
      setAlertMessage(
        '❌ ' + t(`supabase-error.${error.code || 'unexpected_error'}`)
      );
      setAlertType('danger');
      return;
    }
    // log.info('Connexion réussie', {
    //   id: 'LOGIN-SUCCESS',
    //   origin: 'Auth.js',
    //   user: userInfo?.uid,
    // });
    navigation.navigate('AuthCallback', { redirect });
  };

  const handleRegister = async () => {
    const error = await registerWithEmail(email, password, name, redirect);
    if (error) {
      setAlertMessage(
        '❌ ' + t(`supabase-error.${error.code || 'unexpected_error'}`)
      );
      setAlertType('danger');
      return;
    }
    // log.info('Inscription réussie', {
    //   id: 'REGISTER-SUCCESS',
    //   origin: 'Auth.js',
    //   user: userInfo?.uid,
    // });
  };

  const handleSubmit = async () => {
    try {
      if (activeTab === 'login') {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      // log.error('Supabase auth error', {
      //   id: 'AUTH-ERROR',
      //   origin: 'Auth.js',
      //   stack: err.stack,
      // });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="medical" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>MediTime</Text>
            <Text style={styles.subtitle}>Gérez vos médicaments facilement</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#212529',
  },
  passwordToggle: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#a6b6c7',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#6c757d',
    fontSize: 16,
  },
  registerLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
