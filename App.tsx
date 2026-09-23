import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/Header';
import RoleRow from './components/RoleRow';
import { ROLES } from './data/spells';
import { StoreProvider } from './state/store';

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <View style={styles.screen}>
            <Header />
            {ROLES.map((role) => (
              <RoleRow key={role} role={role} />
            ))}
            <Text style={styles.hint}>Tap a spell to start its cooldown · tap again to reset</Text>
          </View>
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screen: {
    flex: 1,
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
