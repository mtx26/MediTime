import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function canUseHaptics() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function hapticSelection() {
  if (!canUseHaptics()) return;
  void Haptics.selectionAsync().catch(() => undefined);
}

export function hapticImpact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (!canUseHaptics()) return;
  void Haptics.impactAsync(style).catch(() => undefined);
}
