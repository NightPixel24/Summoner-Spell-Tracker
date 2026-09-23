import { StyleSheet, Text, View } from 'react-native';
import { Role, SPELLS, UPGRADES } from '../data/spells';
import { LABEL_WIDTH, ROW_GAP, TILE_GAP } from '../hooks/useLayout';
import { holdFeedback, readyFeedback, tapFeedback } from '../lib/feedback';
import { slotKey, slotsFor, useStore } from '../state/store';
import { colors, fonts, radius } from '../theme';
import SpellTile from './SpellTile';

const ROLE_NAMES: Record<Role, string> = {
  TOP: 'Top lane',
  JG: 'Jungle',
  MID: 'Mid lane',
  BOT: 'Bot lane',
  SUP: 'Support',
};

interface Props {
  role: Role;
  tile: number; // one size for every tile, worked out by the screen so all rows fit
  padding: number;
}

export default function RoleRow({ role, tile, padding }: Props) {
  const { state, dispatch } = useStore();
  const editing = state.mode === 'edit';
  const slots = slotsFor(role);

  return (
    <View style={[styles.card, { padding }]}>
      <View style={styles.label}>
        <Text style={styles.role} numberOfLines={1} adjustsFontSizeToFit>
          {role}
        </Text>
        <Text style={styles.roleName}>{ROLE_NAMES[role]}</Text>
      </View>
      <View style={styles.tiles}>
        {slots.map((slot) => {
          const key = slotKey(role, slot);
          const spell = state.loadout[role][slot];
          return (
            <SpellTile
              key={key}
              spell={spell}
              size={tile}
              label={`${role} ${SPELLS[spell].name}`}
              timer={state.timers[key]}
              selected={editing && state.selectedSlot === key}
              format={state.timeFormat}
              onPress={() => {
                tapFeedback();
                dispatch({ type: 'tapSlot', key, spell, now: Date.now() });
              }}
              onLongPress={
                !editing && UPGRADES[spell]
                  ? () => {
                      holdFeedback();
                      dispatch({ type: 'upgradeSlot', key });
                    }
                  : undefined
              }
              onExpire={() => {
                readyFeedback();
                dispatch({ type: 'clearTimer', key });
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ROW_GAP,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    width: LABEL_WIDTH,
    paddingLeft: 4,
  },
  role: {
    fontFamily: fonts.displayHeavy,
    fontSize: 22,
    color: colors.gold,
  },
  roleName: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  tiles: {
    flex: 1,
    flexDirection: 'row',
    columnGap: TILE_GAP, // left-aligned so every row's tiles line up in columns
  },
});
