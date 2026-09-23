import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/Header';
import RoleRow from './components/RoleRow';
import SettingsSheet from './components/SettingsSheet';
import SpellPool from './components/SpellPool';
import { ROLES } from './data/spells';
import { PersistentStoreProvider } from './state/PersistentStore';
import { useStore } from './state/store';

export default function App() {
  return (
    <PersistentStoreProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <Tracker />
          <StatusBar style="dark" />
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

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {timersRunning && <KeepScreenOn />}
      <Header
        editing={editing}
        onEdit={() => dispatch({ type: 'toggleEdit' })}
        onSettings={() => setSettingsOpen(true)}
      />
      {ROLES.map((role) => (
        <RoleRow key={role} role={role} />
      ))}
      {editing && <SpellPool />}
      <Text style={styles.hint}>
        {editing ? 'Tap pencil again to finish editing' : 'Tap a spell to start its cooldown · tap again to reset'}
      </Text>
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
    backgroundColor: '#fff',
  },
  screen: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
