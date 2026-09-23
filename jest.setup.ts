import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe-area insets come from native code; use the library's own Jest mock.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// In-memory AsyncStorage, wiped before every test so saved state never leaks between tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});
