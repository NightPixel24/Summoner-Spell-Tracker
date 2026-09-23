import { Pressable, StyleSheet } from 'react-native';
import { SpellId } from '../data/spells';
import SpellArt from './SpellArt';

export const TILE_SIZE = 64;

interface Props {
  spell: SpellId;
  size?: number;
  onPress?: () => void;
}

export default function SpellTile({ spell, size = TILE_SIZE, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width: size, height: size }]}
      accessibilityRole="button"
    >
      <SpellArt spell={spell} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 4,
    overflow: 'hidden',
  },
});
