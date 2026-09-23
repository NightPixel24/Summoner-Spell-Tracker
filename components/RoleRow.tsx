import { StyleSheet, Text, View } from 'react-native';
import { Role, SPELLS, UPGRADES } from '../data/spells';
import { LABEL_WIDTH, LABEL_WIDTH_COMPACT, ROW_GAP, rowTileSize, TILE_GAP, useContentWidth } from '../hooks/useLayout';
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
  tile: number; // tile size, worked out by the screen so all five rows fit
  padding: number;
}

export default function RoleRow({ role, tile, padding }: Props) {
  const { state, dispatch } = useStore();
  const editing = state.mode === 'edit';
  const slots = slotsFor(role);
  const size = rowTileSize(tile, useContentWidth(), slots.length, padding);

  return (
    <View style={[styles.card, { padding }]}>
      <View style={[styles.label, slots.length > 2 && { width: LABEL_WIDTH_COMPACT }]}>
        <Text style={[styles.role, slots.length > 2 && styles.roleCompact]} numberOfLines={1} adjustsFontSizeToFit>
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
              size={size}
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
    fontSize: 24,
    color: colors.gold,
    letterSpacing: 1,
  },
  roleCompact: {
    fontSize: 21,
    letterSpacing: 0,
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
