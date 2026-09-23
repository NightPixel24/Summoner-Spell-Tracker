import { useId } from 'react';
import Svg, { Defs, RadialGradient, Rect, Stop, Text } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';

interface LayerProps {
  spell: SpellId;
  size: number;
  grey?: boolean;
  clipPath?: string; // e.g. url(#id); applied per shape because clipping a <G> doesn't render on Android
}

// Greyscale by luminance, then darken (matches the mockup's grayscale(1) brightness(.55)).
function toGrey(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const v = Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 0.55);
  return `rgb(${v},${v},${v})`;
}

// Placeholder spell icon as SVG elements (radial gradient + letter), so a tile can
// draw it twice inside one <Svg> and clip the colour copy to the cooldown sweep.
// Replaced by the bundled Data Dragon PNGs in milestone 7.
export function SpellArtLayer({ spell, size, grey = false, clipPath }: LayerProps) {
  const { colors, glyph } = SPELLS[spell];
  const [c1, c2] = grey ? colors.map(toGrey) : colors;
  const gradientId = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const fontSize = size * 0.34;

  return (
    <>
      <Defs>
        <RadialGradient id={gradientId} cx="35%" cy="30%" r="96%">
          <Stop offset="0" stopColor={c1} />
          <Stop offset="1" stopColor={c2} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${gradientId})`} clipPath={clipPath} />
      <Text
        x={size / 2}
        y={size / 2 + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        clipPath={clipPath}
        fill={grey ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)'}
      >
        {glyph}
      </Text>
    </>
  );
}

export default function SpellArt({ spell, size }: { spell: SpellId; size: number }) {
  return (
    <Svg width={size} height={size}>
      <SpellArtLayer spell={spell} size={size} />
    </Svg>
  );
}
