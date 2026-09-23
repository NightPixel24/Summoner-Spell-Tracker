import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';

interface Props {
  spell: SpellId;
  size: number;
}

// Placeholder spell icon: radial gradient + letter, matching the mockup.
// Replaced by the bundled Data Dragon PNGs in milestone 7.
export default function SpellArt({ spell, size }: Props) {
  const { colors, glyph } = SPELLS[spell];
  const gradientId = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="35%" cy="30%" r="96%">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${gradientId})`} />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Text style={[styles.glyph, { fontSize: size * 0.34, lineHeight: size }]}>{glyph}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    textAlign: 'center',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.85)',
  },
});
