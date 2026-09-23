import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';
import { useNow } from '../hooks/useNow';
import { TimeFormat, Timer } from '../state/store';
import { colors, radius } from '../theme';
import { SpellArtLayer } from './SpellArt';

export const TILE_SIZE = 64;
const BORDER = 2;

interface Props {
  spell: SpellId;
  timer?: Timer;
  size?: number;
  label?: string;
  selected?: boolean; // edit mode: slot chosen for a swap
  format?: TimeFormat;
  onPress?: () => void;
  onLongPress?: () => void;
  onExpire?: () => void;
}

// Minutes format: m:ss at 60s and above, plain seconds below. Seconds format: always
// whole seconds. Rounds up, so it never shows 0 while time is left.
export function formatRemaining(seconds: number, format: TimeFormat = 'minutes') {
  const s = Math.ceil(seconds);
  if (format === 'seconds' || s < 60) return `${s}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Pie slice from 12 o'clock, clockwise, covering `fraction` of a full turn.
// Radius reaches past the corners so the slice covers the whole square.
function piePath(fraction: number, size: number) {
  const c = size / 2;
  const r = size;
  const angle = fraction * 2 * Math.PI;
  const x = c + r * Math.sin(angle);
  const y = c - r * Math.cos(angle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;
}

export default function SpellTile({
  spell,
  timer,
  size = TILE_SIZE,
  label,
  selected = false,
  format = 'minutes',
  onPress,
  onLongPress,
  onExpire,
}: Props) {
  const now = useNow(!!timer);
  const clipId = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');

  const remaining = timer ? (timer.endsAt - now) / 1000 : 0;
  const running = !!timer && remaining > 0;
  const elapsed = running ? 1 - remaining / timer.total : 1;
  // Whole degrees of sweep. react-native-svg on Android caches a ClipPath by id and
  // ignores later changes to its shape, so each step gets a fresh id.
  const degrees = Math.max(0, Math.floor(elapsed * 360));
  const stepClipId = `${clipId}_${degrees}`;

  // "Just came up": a quick grow-and-flash when a cooldown runs out on its own.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!timer || remaining > 0) return;
    onExpire?.();
    pulse.setValue(0);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [timer, remaining, onExpire, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const art = size - BORDER * 2; // the icon sits inside the frame's border

  return (
    <Animated.View style={[styles.frame, selected && styles.selected, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={450}
        style={[
          styles.tile,
          { width: size, height: size, borderColor: running ? colors.cooldownBorder : colors.goldDim },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label ?? SPELLS[spell].name}
        accessibilityState={{ busy: running, selected }}
      >
        {/* Plain Images for the full icons: react-native-svg's own image loading on Android
            intermittently fails ("fetchDecodedImage failed") while a tile re-renders every
            100ms, leaving the grey layer blank. SVG only draws the clipped colour sweep, whose
            image is already in the shared image cache from the ready state. */}
        <Image
          source={running ? SPELLS[spell].iconGrey : SPELLS[spell].icon}
          style={{ width: art, height: art }}
        />
        {running && (
          <Svg width={art} height={art} style={StyleSheet.absoluteFill}>
            <Defs>
              <ClipPath key={stepClipId} id={stepClipId}>
                <Path d={piePath(degrees / 360, art)} />
              </ClipPath>
            </Defs>
            <SpellArtLayer spell={spell} size={art} clipPath={`url(#${stepClipId})`} />
          </Svg>
        )}
        {running && (
          <Text style={[styles.time, { lineHeight: art, fontSize: Math.round(size * 0.27) }]} pointerEvents="none">
            {formatRemaining(remaining, format)}
          </Text>
        )}
        <Animated.View style={[styles.flash, { opacity: pulse }]} pointerEvents="none" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.tile,
  },
  selected: {
    outlineColor: colors.teal,
    outlineStyle: 'solid',
    outlineWidth: 3,
    outlineOffset: 3,
  },
  tile: {
    borderRadius: radius.tile,
    borderWidth: BORDER,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240,230,210,0.6)',
  },
  time: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '900',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontVariant: ['tabular-nums'],
  },
});
