import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { AuthProvider } from '../src/contexts/AuthContext';
import { supabase } from '../src/services/supabase';
import { configureApi, initLogger } from '@meditime/utils';
import i18n from '../src/i18n';
import { AppThemeProvider, useAppTheme } from '../src/theme/ios';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

configureApi({
  getToken: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
  translate: (key: string) => i18n.t(key),
});

initLogger(API_URL, __DEV__, false);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ThemedApp />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { colorScheme, isDark } = useAppTheme();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <Theme name={colorScheme}>
        <AuthProvider>
          <Slot />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </AuthProvider>
      </Theme>
    </TamaguiProvider>
  );
}
