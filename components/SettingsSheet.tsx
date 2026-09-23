import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPELLS, SPELL_IDS, SpellId } from '../data/spells';
import { isValidCooldown, TimeFormat, useStore } from '../state/store';
import { colors, fonts, radius } from '../theme';
import SpellArt from './SpellArt';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS: { format: TimeFormat; label: string; example: string }[] = [
  { format: 'minutes', label: 'Minutes', example: '4:05' },
  { format: 'seconds', label: 'Seconds', example: '245' },
];

export const RIOT_DISCLAIMER =
  "Summoner Spell Tracker isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games " +
  'or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated ' +
  'properties are trademarks or registered trademarks of Riot Games, Inc.';

export default function SettingsSheet({ visible, onClose }: Props) {
  const { state, dispatch } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings" />
        <View style={[styles.sheet, { paddingBottom: 18 + insets.bottom }]}>
          <View style={styles.grabber} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              Settings
            </Text>

            <Text style={styles.section}>Countdown display</Text>
            <View style={styles.segment} accessibilityRole="radiogroup">
              {FORMAT_OPTIONS.map(({ format, label, example }) => {
                const active = state.timeFormat === format;
                return (
                  <Pressable
                    key={format}
                    style={[styles.segmentOption, active && styles.segmentActive]}
                    onPress={() => dispatch({ type: 'setTimeFormat', format })}
                    accessibilityRole="radio"
                    accessibilityLabel={`Show ${label.toLowerCase()}`}
                    accessibilityState={{ checked: active }}
                  >
                    <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
                    <Text style={[styles.segmentExample, active && styles.segmentLabelActive]}>{example}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Cooldowns (seconds)</Text>
            <Text style={styles.sub}>Summoner's Rift only. Changes apply to the next timer you start.</Text>

            {SPELL_IDS.map((spell) => (
              <CooldownRow
                key={spell}
                spell={spell}
                value={state.cooldowns[spell]}
                onChange={(seconds) => dispatch({ type: 'setCooldown', spell, seconds })}
              />
            ))}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.ghost]}
                onPress={() => dispatch({ type: 'resetCooldowns' })}
                accessibilityRole="button"
              >
                <Text style={styles.ghostText}>Reset defaults</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.primary]} onPress={onClose} accessibilityRole="button">
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>{RIOT_DISCLAIMER}</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CooldownRow({ spell, value, onChange }: { spell: SpellId; value: number; onChange: (s: number) => void }) {
  const { name } = SPELLS[spell];
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  const input = useRef<TextInput>(null);

  // Android's back button hides the keyboard but leaves the field focused, so blur it
  // ourselves; the blur handler then tidies up a blank or invalid entry.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      if (focused.current) input.current?.blur();
    });
    return () => sub.remove();
  }, []);

  // Follow the stored value when it changes elsewhere (e.g. Reset defaults), but never
  // while the user is typing: writing it back mid-edit drops keystrokes on Android.
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <SpellArt spell={spell} size={40} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <TextInput
        ref={input}
        style={styles.input}
        value={text}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={4}
        placeholder={String(value)}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={`${name} cooldown in seconds`}
        onChangeText={(next) => {
          setText(next);
          const seconds = Number(next);
          if (next.trim() !== '' && isValidCooldown(seconds)) onChange(seconds);
        }}
        // Start from an empty field (current value shown as the placeholder). Android's
        // selectTextOnFocus re-selects everything on each keystroke, so typing replaced itself.
        onFocus={() => {
          focused.current = true;
          setText('');
        }}
        // Blank or invalid input goes back to the last saved value.
        onBlur={() => {
          focused.current = false;
          setText(String(value));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: colors.goldDim,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: 22,
    color: colors.gold,
    marginBottom: 4,
  },
  section: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    columnGap: 4,
    borderRadius: radius.button + 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.gold,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  segmentExample: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  segmentLabelActive: {
    color: colors.bg,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  name: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
  },
  input: {
    width: 88,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.bg,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.gold,
  },
  primaryText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  ghost: {
    borderWidth: 1.5,
    borderColor: colors.goldDim,
  },
  ghostText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
});
