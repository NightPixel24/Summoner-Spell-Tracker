import { Cinzel_700Bold, Cinzel_900Black, useFonts } from '@expo-google-fonts/cinzel';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/Header';
import RoleRow from './components/RoleRow';
import SettingsSheet from './components/SettingsSheet';
import SpellPool from './components/SpellPool';
import { ROLES } from './data/spells';
import {
  MAX_CONTENT_WIDTH,
  ROW_PADDING,
  ROW_PADDING_COMPACT,
  SCREEN_PADDING,
  tileSizeFor,
  useContentWidth,
} from './hooks/useLayout';
import { PersistentStoreProvider } from './state/PersistentStore';
import { useStore } from './state/store';
import { colors } from './theme';

export default function App() {
  // Fonts are bundled with the app, so this resolves almost instantly; if loading ever
  // fails the app still renders with the system font.
  const [fontsLoaded, fontError] = useFonts({ Cinzel_700Bold, Cinzel_900Black });
  if (!fontsLoaded && !fontError) return null;

  return (
    <PersistentStoreProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <Tracker />
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </PersistentStoreProvider>
  );
}

function Tracker() {
  const { state, dispatch } = useStore();
  const editing = state.mode === 'edit';
  const timersRunning = Object.keys(state.timers).length > 0;
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Measure everything that isn't a role row, then size the tiles to fill exactly what's
  // left, so the whole tracker (and the spell pool in edit mode) fits without scrolling.
  // Starting guesses are only used for the first frame.
  const [viewport, setViewport] = useState(0);
  const [header, setHeader] = useState(80);
  const [pool, setPool] = useState(260);
  const [hint, setHint] = useState(34);
  const measure = (set: (h: number) => void) => (e: LayoutChangeEvent) => set(e.nativeEvent.layout.height);

  const contentWidth = useContentWidth();
  const rowPadding = editing ? ROW_PADDING_COMPACT : ROW_PADDING;
  const rowsHeight = viewport - SCREEN_PADDING * 2 - header - hint - (editing ? pool : 0);
  const tile = tileSizeFor(contentWidth, rowsHeight, rowPadding);

  return (
    <ScrollView contentContainerStyle={styles.screen} onLayout={measure(setViewport)}>
      {timersRunning && <KeepScreenOn />}
      <View onLayout={measure(setHeader)}>
        <Header
          editing={editing}
          onEdit={() => dispatch({ type: 'toggleEdit' })}
          onSettings={() => setSettingsOpen(true)}
        />
      </View>
      {ROLES.map((role) => (
        <RoleRow key={role} role={role} tile={tile} padding={rowPadding} />
      ))}
      {editing && (
        <View onLayout={measure(setPool)}>
          <SpellPool />
        </View>
      )}
      <View onLayout={measure(setHint)}>
        <Text style={styles.hint}>
          {editing ? 'Tap the pencil again to finish editing' : 'Tap a spell to start its cooldown · tap again to reset'}
        </Text>
      </View>
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScrollView>
  );
}

// Stops the phone locking mid-game while any cooldown is counting down.
function KeepScreenOn() {
  useKeepAwake('spell-timers');
  return null;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: SCREEN_PADDING,
  },
  hint: {
    paddingTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
