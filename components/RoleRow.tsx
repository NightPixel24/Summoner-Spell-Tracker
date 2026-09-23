import { StyleSheet, Text, View } from 'react-native';
import { Role, SpellId } from '../data/spells';
import SpellTile from './SpellTile';

interface Props {
  role: Role;
  spells: [SpellId, SpellId];
}

export default function RoleRow({ role, spells }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.role}>{role}</Text>
      <SpellTile spell={spells[0]} />
      <SpellTile spell={spells[1]} />
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
