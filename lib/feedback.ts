import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Short vibrations. Web has no reliable haptics, and a failed buzz must never break a tap.
function buzz(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  run().catch(() => {});
}

// A spell was tapped (timer started or reset, or a slot picked in edit mode).
export const tapFeedback = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

// A tile was held to change it (Teleport <-> Unleashed Teleport).
export const holdFeedback = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

// A cooldown finished and the spell is back up.
export const readyFeedback = () =>
  buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
