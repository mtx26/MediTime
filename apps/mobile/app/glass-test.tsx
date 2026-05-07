import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassStyle,
} from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../src/theme/ios';

const glassStyles: GlassStyle[] = ['regular', 'clear', 'none'];

export default function GlassTestScreen() {
  const { colorScheme } = useAppTheme();
  const [glassStyle, setGlassStyle] = useState<GlassStyle>('regular');

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Glass Test',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            color: '#ffffff',
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#000000',
          },
        }}
      />

      <YStack style={styles.content}>
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle={{
            style: glassStyle,
            animate: true,
            animationDuration: 0.4,
          }}
          style={styles.hero}
        >
          <YStack style={{ gap: 10 }}>
            <Text style={styles.kicker}>Liquid Glass</Text>
            <Text style={styles.title}>Reference de rendu</Text>
            <Text style={styles.body}>Page de comparaison directe du rendu natif Expo GlassEffect.</Text>
          </YStack>
        </GlassView>

        <GlassContainer spacing={12} style={styles.orbs}>
          <GlassView style={styles.orbLarge} />
          <GlassView style={styles.orbMedium} />
          <GlassView style={styles.orbSmall} />
        </GlassContainer>

        <GlassView colorScheme={colorScheme} glassEffectStyle="clear" style={styles.card}>
          <YStack style={{ gap: 8 }}>
            <Text style={styles.cardTitle}>Etat runtime</Text>
            <Text style={styles.cardText}>API disponible: {isGlassEffectAPIAvailable() ? 'oui' : 'non'}</Text>
            <Text style={styles.cardText}>Liquid Glass dispo: {isLiquidGlassAvailable() ? 'oui' : 'non'}</Text>
          </YStack>
        </GlassView>

        <XStack style={{ gap: 10, flexWrap: 'wrap' }}>
          {glassStyles.map((value) => (
            <Pressable key={value} onPress={() => setGlassStyle(value)}>
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle={value === glassStyle ? 'regular' : 'clear'}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{value}</Text>
              </GlassView>
            </Pressable>
          ))}
        </XStack>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingTop: 110,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    minHeight: 170,
    borderRadius: 28,
    justifyContent: 'flex-end',
    padding: 22,
  },
  kicker: {
    color: '#f3f7fb',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  body: {
    color: '#edf2f7',
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 280,
  },
  orbs: {
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orbLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  orbMedium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  orbSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  card: {
    borderRadius: 24,
    padding: 18,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  cardText: {
    color: '#edf2f7',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  chip: {
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
