import { StyleSheet, Text, View } from 'react-native';
import { Role } from '../data/spells';
import { Slot, slotKey, useStore } from '../state/store';
import SpellTile from './SpellTile';

const SLOTS: Slot[] = [0, 1];

export default function RoleRow({ role }: { role: Role }) {
  const { state, dispatch } = useStore();

  return (
    <View style={styles.row}>
      <Text style={styles.role}>{role}</Text>
      {SLOTS.map((slot) => {
        const key = slotKey(role, slot);
        const spell = state.loadout[role][slot];
        return (
          <SpellTile
            key={key}
            spell={spell}
            timer={state.timers[key]}
            onPress={() => dispatch({ type: 'startTimer', key, spell, now: Date.now() })}
            onLongPress={() => dispatch({ type: 'clearTimer', key })}
            onExpire={() => dispatch({ type: 'clearTimer', key })}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 24,
    marginBottom: 22,
  },
  role: {
    width: 70,
    paddingLeft: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
});
