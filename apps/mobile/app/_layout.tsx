import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
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

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4f46e5',
    primaryContainer: '#e0e7ff',
    secondary: '#64748b',
    secondaryContainer: '#f1f5f9',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#ffffff',
    error: '#ef4444',
    outline: '#e2e8f0',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <Slot />
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
