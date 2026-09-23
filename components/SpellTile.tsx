import { useEffect, useId } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';
import { useNow } from '../hooks/useNow';
import { Timer } from '../state/store';
import { SpellArtLayer } from './SpellArt';

export const TILE_SIZE = 64;

interface Props {
  spell: SpellId;
  timer?: Timer;
  size?: number;
  label?: string;
  selected?: boolean; // edit mode: slot chosen for a swap
  onPress?: () => void;
  onExpire?: () => void;
}

// m:ss at 60s and above, plain seconds below.
export function formatRemaining(seconds: number) {
  const s = Math.ceil(seconds);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}`;
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
  onPress,
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

  useEffect(() => {
    if (timer && remaining <= 0) onExpire?.();
  }, [timer, remaining, onExpire]);

  return (
    <View style={[styles.frame, selected && styles.selected]}>
      <Pressable
        onPress={onPress}
        style={[styles.tile, { width: size, height: size }]}
        accessibilityRole="button"
        accessibilityLabel={label ?? SPELLS[spell].name}
        accessibilityState={{ busy: running, selected }}
      >
        <Svg width={size} height={size}>
          {running ? (
            <>
              <SpellArtLayer spell={spell} size={size} grey />
              <Defs>
                <ClipPath key={stepClipId} id={stepClipId}>
                  <Path d={piePath(degrees / 360, size)} />
                </ClipPath>
              </Defs>
              <SpellArtLayer spell={spell} size={size} clipPath={`url(#${stepClipId})`} />
            </>
          ) : (
            <SpellArtLayer spell={spell} size={size} />
          )}
        </Svg>
        {running && (
          <Text style={[styles.time, { lineHeight: size }]} pointerEvents="none">
            {formatRemaining(remaining)}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 4,
  },
  selected: {
    outlineColor: '#2f80ed',
    outlineStyle: 'solid',
    outlineWidth: 3,
    outlineOffset: 3,
  },
  tile: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  time: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
