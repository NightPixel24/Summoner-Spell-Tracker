import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Gentle ±1.5° rock, like the mockup's edit-mode wiggle (0.35s each way).
export function useWiggle(active: boolean) {
  const t = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!active) {
      t.setValue(0.5);
      return;
    }
    const swing = (toValue: number) =>
      Animated.timing(t, { toValue, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([swing(1), swing(0)]));
    loop.start();
    return () => loop.stop();
  }, [active, t]);

  return t.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
}
