import { StyleSheet, Text, View } from 'react-native';
import { SPELLS, SPELL_IDS } from '../data/spells';
import { POOL_GAP, POOL_PADDING, poolTileFor, useContentWidth } from '../hooks/useLayout';
import { tapFeedback } from '../lib/feedback';
import { useStore } from '../state/store';
import { colors, fonts, radius } from '../theme';
import SpellTile from './SpellTile';

// Edit mode: every Summoner's Rift spell, tap one to swap it into the selected slot.
export default function SpellPool() {
  const { state, dispatch } = useStore();
  const size = poolTileFor(useContentWidth());

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Spell pool</Text>
      <Text style={styles.help}>
        {state.selectedSlot ? 'Tap a spell to swap it into the highlighted slot.' : 'Tap a slot above, then a spell here to swap it in.'}
      </Text>
      <View style={styles.grid}>
        {SPELL_IDS.map((spell) => (
          <View key={spell} style={styles.item}>
            <SpellTile
              spell={spell}
              size={size}
              label={`Swap in ${SPELLS[spell].name}`}
              onPress={() => {
                tapFeedback();
                dispatch({ type: 'assignSpell', spell });
              }}
            />
            <Text style={styles.name} numberOfLines={1}>
              {SPELLS[spell].name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    padding: POOL_PADDING,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.gold,
    letterSpacing: 1,
  },
  help: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: POOL_GAP,
    rowGap: 8,
  },
  item: {
    alignItems: 'center',
    rowGap: 3,
  },
  name: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
