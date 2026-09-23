import { StyleSheet, Text, View } from 'react-native';
import { Role, SPELLS } from '../data/spells';
import { LABEL_WIDTH, ROW_GAP, TILE_GAP } from '../hooks/useLayout';
import { readyFeedback, tapFeedback } from '../lib/feedback';
import { Slot, slotKey, useStore } from '../state/store';
import { colors, fonts, radius } from '../theme';
import SpellTile from './SpellTile';

const SLOTS: Slot[] = [0, 1];

const ROLE_NAMES: Record<Role, string> = {
  TOP: 'Top lane',
  JG: 'Jungle',
  MID: 'Mid lane',
  BOT: 'Bot lane',
  SUP: 'Support',
};

interface Props {
  role: Role;
  tile: number; // tile size, worked out by the screen so all five rows fit
  padding: number;
}

export default function RoleRow({ role, tile, padding }: Props) {
  const { state, dispatch } = useStore();
  const editing = state.mode === 'edit';

  return (
    <View style={[styles.card, { padding }]}>
      <View style={styles.label}>
        <Text style={styles.role}>{role}</Text>
        <Text style={styles.roleName}>{ROLE_NAMES[role]}</Text>
      </View>
      <View style={styles.tiles}>
        {SLOTS.map((slot) => {
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
    fontSize: 24,
    color: colors.gold,
    letterSpacing: 1,
  },
  roleName: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  tiles: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: TILE_GAP,
  },
});
