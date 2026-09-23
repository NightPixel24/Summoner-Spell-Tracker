import { ReactNode, useEffect, useState } from 'react';
import { loadState, saveState } from './storage';
import { AppState, StoreProvider, useStore } from './store';

// Loads the saved loadout, cooldowns and timers before showing the app, then saves
// them whenever they change. Nothing renders until loading finishes (a few ms),
// so the defaults never flash up before the saved setup.
export function PersistentStoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<AppState | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadState().then((state) => {
      if (!cancelled) setLoaded(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;
  return (
    <StoreProvider initial={loaded}>
      <AutoSave />
      {children}
    </StoreProvider>
  );
}

function AutoSave() {
  const { state } = useStore();
  const { loadout, cooldowns, timers } = state;

  useEffect(() => {
    saveState(state);
    // Only the persisted parts matter; mode and selection changes don't need a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadout, cooldowns, timers]);

  return null;
}
