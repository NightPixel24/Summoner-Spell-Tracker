import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOADOUT } from '../data/spells';
import { loadState, restore, saveState, STORAGE_KEY } from '../state/storage';
import { initialState, reducer } from '../state/store';

const NOW = 1_000_000;

describe('restore', () => {
  it('falls back to defaults for nothing saved or garbage', () => {
    for (const raw of [null, undefined, 'nope', 42, [], {}]) {
      expect(restore(raw, NOW)).toEqual(initialState);
    }
  });

  it('keeps a valid saved loadout, cooldowns and running timers', () => {
    const saved = {
      loadout: { ...DEFAULT_LOADOUT, TOP: ['ghost', 'ignite'] },
      cooldowns: { ...initialState.cooldowns, flash: 270 },
      timers: { 'MID-0': { endsAt: NOW + 100_000, total: 300 } },
    };
    const state = restore(saved, NOW);
    expect(state.loadout.TOP).toEqual(['ghost', 'ignite']);
    expect(state.cooldowns.flash).toBe(270);
    expect(state.timers).toEqual({ 'MID-0': { endsAt: NOW + 100_000, total: 300 } });
    expect(state.mode).toBe('track');
    expect(state.selectedSlot).toBeNull();
  });

  it('drops timers that finished while the app was closed', () => {
    const saved = { timers: { 'TOP-0': { endsAt: NOW - 1, total: 300 }, 'JG-1': { endsAt: NOW, total: 90 } } };
    expect(restore(saved, NOW).timers).toEqual({});
  });

  it('drops malformed timers and unknown slots', () => {
    const saved = {
      timers: {
        'TOP-0': { endsAt: NOW + 999_999_999, total: 300 }, // ends later than its own length allows
        'TOP-1': { endsAt: 'soon', total: 300 },
        'JG-0': { endsAt: NOW + 5_000, total: 0 },
        'ARAM-0': { endsAt: NOW + 5_000, total: 300 },
      },
    };
    expect(restore(saved, NOW).timers).toEqual({});
  });

  it('replaces only the invalid parts of a loadout or cooldown table', () => {
    const saved = {
      loadout: { TOP: ['flash', 'clarity'], JG: ['smite'], MID: ['flash', 'barrier'] },
      cooldowns: { flash: 0, heal: 'x', smite: 75, mark: 80 },
    };
    const state = restore(saved, NOW);
    expect(state.loadout.TOP).toEqual(DEFAULT_LOADOUT.TOP);
    expect(state.loadout.JG).toEqual(DEFAULT_LOADOUT.JG);
    expect(state.loadout.MID).toEqual(['flash', 'barrier']);
    expect(state.cooldowns.flash).toBe(300);
    expect(state.cooldowns.heal).toBe(240);
    expect(state.cooldowns.smite).toBe(75);
    expect(state.cooldowns).not.toHaveProperty('mark');
  });
});

describe('restore timeFormat', () => {
  it('keeps a saved seconds setting and ignores anything unknown', () => {
    expect(restore({ timeFormat: 'seconds' }, NOW).timeFormat).toBe('seconds');
    expect(restore({ timeFormat: 'hours' }, NOW).timeFormat).toBe('minutes');
    expect(restore({}, NOW).timeFormat).toBe('minutes');
  });
});

describe('loadState / saveState', () => {
  it('round-trips loadout, cooldowns and timers but not edit mode', async () => {
    let s = reducer(initialState, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    s = reducer(s, { type: 'setCooldown', spell: 'heal', seconds: 200 });
    s = reducer(s, { type: 'toggleEdit' });
    s = reducer(s, { type: 'tapSlot', key: 'SUP-1', spell: 'exhaust', now: NOW });
    s = reducer(s, { type: 'assignSpell', spell: 'barrier' });
    await saveState(s);

    const loaded = await loadState(NOW + 1_000);
    expect(loaded.loadout).toEqual(s.loadout);
    expect(loaded.cooldowns).toEqual(s.cooldowns);
    expect(loaded.timers).toEqual(s.timers);
    expect(loaded.mode).toBe('track');
    expect(loaded.selectedSlot).toBeNull();
  });

  it('returns defaults when nothing is saved', async () => {
    expect(await loadState(NOW)).toEqual(initialState);
  });

  it('returns defaults when the saved JSON is corrupt', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{not json');
    expect(await loadState(NOW)).toEqual(initialState);
  });
});
