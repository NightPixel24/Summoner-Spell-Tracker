import Svg, { Image } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';

interface LayerProps {
  spell: SpellId;
  size: number;
  grey?: boolean;
  clipPath?: string; // e.g. url(#id); applied to the shape because clipping a <G> doesn't render on Android
}

// A spell icon as an SVG element, so a tile can draw the grey and colour copies inside
// one <Svg> and clip the colour copy to the cooldown sweep.
export function SpellArtLayer({ spell, size, grey = false, clipPath }: LayerProps) {
  const { icon, iconGrey } = SPELLS[spell];
  return (
    <Image
      href={grey ? iconGrey : icon}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid slice"
      clipPath={clipPath}
    />
  );
}

export default function SpellArt({ spell, size }: { spell: SpellId; size: number }) {
  return (
    <Svg width={size} height={size}>
      <SpellArtLayer spell={spell} size={size} />
    </Svg>
  );
}
