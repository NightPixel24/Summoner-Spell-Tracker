import { Image } from 'react-native';
import { Image as SvgImage } from 'react-native-svg';
import { SPELLS, SpellId } from '../data/spells';

interface LayerProps {
  spell: SpellId;
  size: number;
  clipPath?: string; // e.g. url(#id); applied to the shape because clipping a <G> doesn't render on Android
}

// The colour icon as an SVG element, so a tile can clip it to the cooldown sweep.
export function SpellArtLayer({ spell, size, clipPath }: LayerProps) {
  return (
    <SvgImage
      href={SPELLS[spell].icon}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid slice"
      clipPath={clipPath}
    />
  );
}

// A plain spell icon (spell pool, settings). A normal Image, not SVG, so it loads reliably
// and warms the image cache the SVG sweep reads from.
export default function SpellArt({ spell, size }: { spell: SpellId; size: number }) {
  return <Image source={SPELLS[spell].icon} style={{ width: size, height: size }} />;
}
