import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useColorScheme } from 'react-native';

export type AppThemeName = 'light' | 'dark';
export type AppThemePreference = AppThemeName | 'system';

const iosThemes = {
  light: {
    background: '#f2f2f7',
    card: '#ffffff',
    foreground: '#111111',
    primary: '#007aff',
    primaryForeground: '#ffffff',
    mutedForeground: '#8e8e93',
    border: '#d1d1d6',
    accentHover: '#e5e5ea',
    blueInfoBg: '#e8f3ff',
    blueInfoBorder: '#bfddff',
    blueText: '#007aff',
    warningBg: '#fff8e1',
    warningText: '#a05a00',
    destructive: '#ff3b30',
    destructiveBg: '#fff1f0',
    destructiveBorder: '#fecaca',
    success: '#34c759',
    successBg: '#eaf8ee',
    overlay: 'rgba(0, 0, 0, 0.25)',
    tabBarBackground: 'rgba(255, 255, 255, 0.96)',
    tabBarBorder: 'rgba(209, 209, 214, 0.72)',
    shadow: '#000000',
  },
  dark: {
    background: '#000000',
    card: '#1c1c1e',
    foreground: '#f5f5f7',
    primary: '#0a84ff',
    primaryForeground: '#ffffff',
    mutedForeground: '#98989d',
    border: '#38383a',
    accentHover: '#2c2c2e',
    blueInfoBg: '#0b2942',
    blueInfoBorder: '#164f82',
    blueText: '#64b5ff',
    warningBg: '#3a2a08',
    warningText: '#ffd166',
    destructive: '#ff453a',
    destructiveBg: '#3a1010',
    destructiveBorder: '#7f1d1d',
    success: '#30d158',
    successBg: '#0f2f18',
    overlay: 'rgba(0, 0, 0, 0.58)',
    tabBarBackground: 'rgba(28, 28, 30, 0.96)',
    tabBarBorder: 'rgba(84, 84, 88, 0.72)',
    shadow: '#000000',
  },
} as const;

export type IosTheme = (typeof iosThemes)[AppThemeName];

type AppThemeContextValue = {
  colorScheme: AppThemeName;
  ios: IosTheme;
  isDark: boolean;
  setThemePreference: Dispatch<SetStateAction<AppThemePreference>>;
  themePreference: AppThemePreference;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export const ios = iosThemes.light;

export function getIosTheme(colorScheme: AppThemeName) {
  return iosThemes[colorScheme];
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<AppThemePreference>('system');
  const colorScheme: AppThemeName = themePreference === 'system'
    ? systemColorScheme === 'dark' ? 'dark' : 'light'
    : themePreference;

  const value = useMemo<AppThemeContextValue>(() => ({
    colorScheme,
    ios: getIosTheme(colorScheme),
    isDark: colorScheme === 'dark',
    setThemePreference,
    themePreference,
  }), [colorScheme, themePreference]);

  return React.createElement(AppThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return context;
}

export function useIosTheme() {
  return useAppTheme().ios;
}
