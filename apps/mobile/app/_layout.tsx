import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import i18n from '../src/i18n';
import { supabase } from '../src/services/supabase';
import { configureApi, initLogger } from '@meditime/utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? null;

configureApi({
  getToken: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
  translate: (key: string) => i18n.t(key),
});

initLogger(API_URL, __DEV__, false);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Slot />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
