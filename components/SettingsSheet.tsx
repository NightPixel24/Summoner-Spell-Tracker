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
import { isValidCooldown, useStore } from '../state/store';
import SpellArt from './SpellArt';

interface Props {
  visible: boolean;
  onClose: () => void;
}

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
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              Cooldowns (seconds)
            </Text>
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
        <SpellArt spell={spell} size={32} />
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
        placeholderTextColor="#9ca3af"
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#f4f5f7',
    borderTopWidth: 2,
    borderTopColor: '#1f3b4d',
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    overflow: 'hidden',
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  input: {
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    backgroundColor: '#fff',
    fontSize: 14,
    textAlign: 'right',
    color: '#111',
  },
  actions: {
    flexDirection: 'row',
    columnGap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#2f80ed',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  ghost: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  ghostText: {
    color: '#111',
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 10,
    lineHeight: 14,
    color: '#6b7280',
  },
});
