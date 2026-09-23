import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROLES, SLOTS_PER_ROLE, SPELLS, SpellId } from '../data/spells';
import { AppState, defaultCooldowns, initialState, isValidCooldown, SlotKey, slotsFor, Timer } from './store';

// Bump the version if the saved shape changes incompatibly; old saves are then ignored.
export const STORAGE_KEY = 'summoner-spell-tracker:v1';

export type Saved = Pick<AppState, 'loadout' | 'cooldowns' | 'timers' | 'timeFormat'>;

const isSpellId = (v: unknown): v is SpellId => typeof v === 'string' && v in SPELLS;

// Rebuild state from whatever was stored, keeping only the parts that are valid.
// Anything missing or malformed falls back to the default, so a bad save can't crash the app.
export function restore(raw: unknown, now: number): AppState {
  const saved = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;

  const loadout = { ...initialState.loadout };
  for (const role of ROLES) {
    const spells = saved.loadout?.[role];
    if (!Array.isArray(spells) || !spells.every(isSpellId)) continue;
    const want = SLOTS_PER_ROLE[role];
    if (spells.length === want) loadout[role] = [...spells];
    // A two-spell save from before TOP gained its third slot keeps both; the new slot gets its default.
    else if (spells.length === 2 && want > 2) loadout[role] = [...spells, ...initialState.loadout[role].slice(spells.length)];
  }

  const cooldowns = { ...initialState.cooldowns };
  for (const [spell, seconds] of Object.entries(saved.cooldowns ?? {})) {
    if (isSpellId(spell) && typeof seconds === 'number' && isValidCooldown(seconds)) cooldowns[spell] = seconds;
  }

  // Keep timers that are still running; ones that finished while the app was closed are dropped.
  const timers: Partial<Record<SlotKey, Timer>> = {};
  for (const role of ROLES) {
    for (const slot of slotsFor(role)) {
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

  const timeFormat = saved.timeFormat === 'seconds' ? 'seconds' : 'minutes';

  return { ...initialState, loadout, cooldowns, timers, timeFormat };
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
  // Only cooldowns the user changed are stored, so a new default (e.g. after a patch)
  // reaches everyone who hasn't overridden that spell.
  const defaults = defaultCooldowns();
  const overrides = Object.fromEntries(
    Object.entries(state.cooldowns).filter(([spell, seconds]) => seconds !== defaults[spell as SpellId]),
  );
  const saved: Saved = {
    loadout: state.loadout,
    cooldowns: overrides as AppState['cooldowns'],
    timers: state.timers,
    timeFormat: state.timeFormat,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage full or unavailable: the tracker keeps working, it just won't survive a restart.
  }
}
