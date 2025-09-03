// src/screens/auth/AuthCallback.js
import { useEffect, useContext, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/supabaseClient';
import { getGlobalReloadUser, UserContext } from '../../contexts/UserContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';
import { getValidRedirect } from '../../utils/redirect';

const AuthCallback = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const reloadUser = getGlobalReloadUser();

  // Pour stocker redirect et type entre les deux effets
  const redirectRef = useRef(null);
  const typeRef = useRef(null);

  const redirectMap = new Map([
    ['recovery', 'ResetPasswordConfirm'],
    ['invite', 'ResetPasswordConfirm'],
    ['email_change', 'Account'],
    ['reauthentication', 'Security'],
    ['magiclink', 'CalendarList'],
    ['signup', 'CalendarList'],
  ]);

  const getRedirectPath = (rawType) =>
    redirectMap.get(String(rawType)) || 'CalendarList';


  // 1) Vérifie la session et lance le reloadUser
  useEffect(() => {
    const handleRedirect = async () => {
      const { redirect, type } = route.params || {};
      redirectRef.current = getValidRedirect(redirect);
      typeRef.current = type;

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        log.error(t('auth_callback.session_error'), error?.message, {
          origin: 'CALLBACK_ERROR',
          uid: null,
        });
        return navigation.navigate('Auth', { screen: 'login' });
      }

      const user = session.user;
      reloadUser(session);

      log.info(t('auth_callback.success'), {
        origin: 'CALLBACK_SUCCESS',
        uid: user.id,
        type: typeRef.current,
        redirect: redirectRef.current,
      });
    };

    handleRedirect();
  }, [navigation, reloadUser, t, route.params]);

  // 2) Redirige quand userInfo est dispo
  useEffect(() => {
    if (!userInfo) return;

    const redirect = redirectRef.current;
    const type = typeRef.current;

    if (redirect) {
      navigation.navigate(redirect, { replace: true });
      return;
    }

    navigation.navigate(getRedirectPath(type), { replace: true });
  }, [userInfo, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>{t('auth_callback.loading')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default AuthCallback;
