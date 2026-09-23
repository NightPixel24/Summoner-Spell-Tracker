import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';

interface Props {
  editing?: boolean;
  onEdit?: () => void;
  onSettings?: () => void;
}

export default function Header({ editing = false, onEdit, onSettings }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.kicker}>SUMMONER</Text>
        <Text style={styles.title}>Spell Tracker</Text>
      </View>
      <View style={styles.icons}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.iconBtn, editing && styles.iconBtnActive, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Edit spells"
          accessibilityState={{ selected: editing }}
          hitSlop={6}
        >
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke={editing ? colors.bg : colors.gold}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M12 20h9" />
            <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </Svg>
        </Pressable>
        <Pressable
          onPress={onSettings}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={6}
        >
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.gold}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Circle cx={12} cy={12} r={3} />
            <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  kicker: {
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 4,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: 28,
    color: colors.text,
    letterSpacing: 0.5,
  },
  icons: {
    flexDirection: 'row',
    columnGap: 10,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.goldDim,
    backgroundColor: colors.surface,
  },
  iconBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  pressed: {
    opacity: 0.7,
  },
});
