import { StyleSheet, Text, View } from 'react-native';
import { SPELLS, SPELL_IDS } from '../data/spells';
import { useStore } from '../state/store';
import SpellTile from './SpellTile';

const POOL_TILE_SIZE = 44;

// Edit mode: every Summoner's Rift spell, tap one to swap it into the selected slot.
export default function SpellPool() {
  const { dispatch } = useStore();

  return (
    <View style={styles.pool}>
      <Text style={styles.help}>Edit mode: tap a slot above, then tap a spell below to swap it in.</Text>
      <View style={styles.grid}>
        {SPELL_IDS.map((spell) => (
          <SpellTile
            key={spell}
            spell={spell}
            size={POOL_TILE_SIZE}
            label={`Swap in ${SPELLS[spell].name}`}
            onPress={() => dispatch({ type: 'assignSpell', spell })}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pool: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  help: {
    marginBottom: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: POOL_TILE_SIZE * 5 + 8 * 4,
  },
});
