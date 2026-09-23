import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/Header';
import RoleRow from './components/RoleRow';
import SettingsSheet from './components/SettingsSheet';
import SpellPool from './components/SpellPool';
import { ROLES } from './data/spells';
import { StoreProvider, useStore } from './state/store';

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <Tracker />
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    </StoreProvider>
  );
}

function Tracker() {
  const { state, dispatch } = useStore();
  const editing = state.mode === 'edit';
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
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
