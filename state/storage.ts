import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROLES, SPELLS, SpellId } from '../data/spells';
import { AppState, initialState, isValidCooldown, SlotKey, Timer } from './store';

// Bump the version if the saved shape changes incompatibly; old saves are then ignored.
export const STORAGE_KEY = 'summoner-spell-tracker:v1';

export type Saved = Pick<AppState, 'loadout' | 'cooldowns' | 'timers'>;

const isSpellId = (v: unknown): v is SpellId => typeof v === 'string' && v in SPELLS;

// Rebuild state from whatever was stored, keeping only the parts that are valid.
// Anything missing or malformed falls back to the default, so a bad save can't crash the app.
export function restore(raw: unknown, now: number): AppState {
  const saved = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;

  const loadout = { ...initialState.loadout };
  for (const role of ROLES) {
    const pair = saved.loadout?.[role];
    if (Array.isArray(pair) && pair.length === 2 && pair.every(isSpellId)) loadout[role] = [pair[0], pair[1]];
  }

  const cooldowns = { ...initialState.cooldowns };
  for (const [spell, seconds] of Object.entries(saved.cooldowns ?? {})) {
    if (isSpellId(spell) && typeof seconds === 'number' && isValidCooldown(seconds)) cooldowns[spell] = seconds;
  }

  // Keep timers that are still running; ones that finished while the app was closed are dropped.
  const timers: Partial<Record<SlotKey, Timer>> = {};
  for (const role of ROLES) {
    for (const slot of [0, 1] as const) {
      const key: SlotKey = `${role}-${slot}`;
      const t = saved.timers?.[key];
      if (
        t &&
        typeof t.endsAt === 'number' &&
        typeof t.total === 'number' &&
        isValidCooldown(t.total) &&
        t.endsAt > now &&
        t.endsAt <= now + t.total * 1000
      ) {
        timers[key] = { endsAt: t.endsAt, total: t.total };
      }
    }
  }

  return { ...initialState, loadout, cooldowns, timers };
}

export async function loadState(now = Date.now()): Promise<AppState> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return restore(json ? JSON.parse(json) : null, now);
  } catch {
    return initialState;
  }
}

export async function saveState(state: AppState): Promise<void> {
  const saved: Saved = { loadout: state.loadout, cooldowns: state.cooldowns, timers: state.timers };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage full or unavailable: the tracker keeps working, it just won't survive a restart.
  }
}
