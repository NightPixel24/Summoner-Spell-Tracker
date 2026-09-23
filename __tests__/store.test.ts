import { DEFAULT_LOADOUT } from '../data/spells';
import { AppState, initialState, MAX_COOLDOWN, nextSlot, reducer, SLOT_ORDER } from '../state/store';

const NOW = 1_000_000;

describe('initial state', () => {
  it('starts with the default loadout, default cooldowns and no timers', () => {
    expect(initialState.loadout).toEqual(DEFAULT_LOADOUT);
    expect(initialState.cooldowns.flash).toBe(300);
    expect(initialState.cooldowns.smite).toBe(90);
    expect(initialState.timers).toEqual({});
    expect(initialState.mode).toBe('track');
  });
});

describe('tapSlot', () => {
  it('starts a cooldown on a ready slot using an endsAt timestamp', () => {
    const next = reducer(initialState, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    expect(next.timers['TOP-0']).toEqual({ endsAt: NOW + 300_000, total: 300 });
  });

  it('uses the user-edited cooldown, not the default', () => {
    const state: AppState = { ...initialState, cooldowns: { ...initialState.cooldowns, flash: 270 } };
    const next = reducer(state, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    expect(next.timers['TOP-0']).toEqual({ endsAt: NOW + 270_000, total: 270 });
  });

  it('resets a running timer to ready', () => {
    const running = reducer(initialState, { type: 'tapSlot', key: 'MID-1', spell: 'ignite', now: NOW });
    const next = reducer(running, { type: 'tapSlot', key: 'MID-1', spell: 'ignite', now: NOW + 5_000 });
    expect(next.timers['MID-1']).toBeUndefined();
  });

  it('starts a fresh cooldown when the old timer has already expired', () => {
    const running = reducer(initialState, { type: 'tapSlot', key: 'JG-1', spell: 'smite', now: NOW });
    const later = NOW + 90_000; // exactly at expiry
    const next = reducer(running, { type: 'tapSlot', key: 'JG-1', spell: 'smite', now: later });
    expect(next.timers['JG-1']).toEqual({ endsAt: later + 90_000, total: 90 });
  });

  it('leaves other slots alone', () => {
    const a = reducer(initialState, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    const b = reducer(a, { type: 'tapSlot', key: 'BOT-1', spell: 'heal', now: NOW + 1_000 });
    const c = reducer(b, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW + 2_000 });
    expect(c.timers['TOP-0']).toBeUndefined();
    expect(c.timers['BOT-1']).toEqual({ endsAt: NOW + 1_000 + 240_000, total: 240 });
  });

  it('does not mutate the previous state', () => {
    const before = JSON.stringify(initialState);
    reducer(initialState, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    expect(JSON.stringify(initialState)).toBe(before);
  });
});

describe('clearTimer', () => {
  it('removes the timer for that slot', () => {
    const running = reducer(initialState, { type: 'tapSlot', key: 'SUP-1', spell: 'exhaust', now: NOW });
    const next = reducer(running, { type: 'clearTimer', key: 'SUP-1' });
    expect(next.timers).toEqual({});
  });

  it('returns the same state object when there is nothing to clear', () => {
    expect(reducer(initialState, { type: 'clearTimer', key: 'SUP-1' })).toBe(initialState);
  });
});

describe('edit mode', () => {
  const editing = reducer(initialState, { type: 'toggleEdit' });

  it('toggleEdit switches modes and clears any selection', () => {
    expect(editing.mode).toBe('edit');
    const selected = reducer(editing, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    const back = reducer(selected, { type: 'toggleEdit' });
    expect(back.mode).toBe('track');
    expect(back.selectedSlot).toBeNull();
  });

  it('tapping a slot selects it instead of starting a timer, and tapping again deselects', () => {
    const selected = reducer(editing, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    expect(selected.selectedSlot).toBe('TOP-1');
    expect(selected.timers).toEqual({});
    const other = reducer(selected, { type: 'tapSlot', key: 'MID-0', spell: 'flash', now: NOW });
    expect(other.selectedSlot).toBe('MID-0');
    const none = reducer(other, { type: 'tapSlot', key: 'MID-0', spell: 'flash', now: NOW });
    expect(none.selectedSlot).toBeNull();
  });

  it('assignSpell swaps the spell into the selected slot and moves to the next one down', () => {
    const selected = reducer(editing, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    const next = reducer(selected, { type: 'assignSpell', spell: 'ignite' });
    expect(next.loadout.TOP).toEqual(['flash', 'ignite', 'teleport']);
    expect(next.loadout.MID).toEqual(DEFAULT_LOADOUT.MID);
    expect(next.selectedSlot).toBe('JG-1');
  });

  it("auto-advance goes down the first column, then the second, then TOP's third slot, then stops", () => {
    expect(SLOT_ORDER).toEqual([
      'TOP-0', 'JG-0', 'MID-0', 'BOT-0', 'SUP-0',
      'TOP-1', 'JG-1', 'MID-1', 'BOT-1', 'SUP-1',
      'TOP-2',
    ]);
    let s = reducer(editing, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    const picks = ['ghost', 'smite', 'barrier', 'heal', 'exhaust', 'teleport', 'flash', 'ignite', 'cleanse', 'flash', 'barrier'] as const;
    for (const [i, spell] of picks.entries()) {
      expect(s.selectedSlot).toBe(SLOT_ORDER[i]);
      s = reducer(s, { type: 'assignSpell', spell });
    }
    expect(s.selectedSlot).toBeNull(); // done after the last slot
    expect(s.loadout).toEqual({
      TOP: ['ghost', 'teleport', 'barrier'],
      JG: ['smite', 'flash'],
      MID: ['barrier', 'ignite'],
      BOT: ['heal', 'cleanse'],
      SUP: ['exhaust', 'flash'],
    });
    expect(nextSlot('SUP-0')).toBe('TOP-1');
    expect(nextSlot('SUP-1')).toBe('TOP-2');
    expect(nextSlot('TOP-2')).toBeNull();
  });

  it('assignSpell resets the swapped slot timer but leaves other timers running', () => {
    let s = reducer(initialState, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    s = reducer(s, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    s = reducer(s, { type: 'toggleEdit' });
    s = reducer(s, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    s = reducer(s, { type: 'assignSpell', spell: 'barrier' });
    expect(s.timers['TOP-1']).toBeUndefined();
    expect(s.timers['TOP-0']).toBeDefined();
  });

  it('assignSpell does nothing with no slot selected, or outside edit mode', () => {
    expect(reducer(editing, { type: 'assignSpell', spell: 'ghost' })).toBe(editing);
    const tracking = { ...initialState, selectedSlot: 'TOP-0' as const };
    expect(reducer(tracking, { type: 'assignSpell', spell: 'ghost' })).toBe(tracking);
  });
});

describe('cooldown settings', () => {
  it('setCooldown stores a new value for that spell only', () => {
    const next = reducer(initialState, { type: 'setCooldown', spell: 'flash', seconds: 270 });
    expect(next.cooldowns.flash).toBe(270);
    expect(next.cooldowns.teleport).toBe(300);
  });

  it.each([0, -5, 12.5, NaN, MAX_COOLDOWN + 1])('setCooldown ignores invalid value %p', (seconds) => {
    expect(reducer(initialState, { type: 'setCooldown', spell: 'flash', seconds })).toBe(initialState);
  });

  it('accepts the maximum cooldown', () => {
    const next = reducer(initialState, { type: 'setCooldown', spell: 'smite', seconds: MAX_COOLDOWN });
    expect(next.cooldowns.smite).toBe(MAX_COOLDOWN);
  });

  it('does not change a timer that is already running', () => {
    let s = reducer(initialState, { type: 'tapSlot', key: 'TOP-0', spell: 'flash', now: NOW });
    s = reducer(s, { type: 'setCooldown', spell: 'flash', seconds: 270 });
    expect(s.timers['TOP-0']).toEqual({ endsAt: NOW + 300_000, total: 300 });
    // ...but the next one uses the new value.
    s = reducer(s, { type: 'tapSlot', key: 'JG-0', spell: 'flash', now: NOW });
    expect(s.timers['JG-0']).toEqual({ endsAt: NOW + 270_000, total: 270 });
  });

  it('resetCooldowns restores every default', () => {
    let s = reducer(initialState, { type: 'setCooldown', spell: 'flash', seconds: 270 });
    s = reducer(s, { type: 'setCooldown', spell: 'smite', seconds: 60 });
    expect(reducer(s, { type: 'resetCooldowns' }).cooldowns).toEqual(initialState.cooldowns);
  });
});

describe('time format', () => {
  it('defaults to minutes and can switch to seconds and back', () => {
    expect(initialState.timeFormat).toBe('minutes');
    const secs = reducer(initialState, { type: 'setTimeFormat', format: 'seconds' });
    expect(secs.timeFormat).toBe('seconds');
    expect(reducer(secs, { type: 'setTimeFormat', format: 'minutes' }).timeFormat).toBe('minutes');
  });
});

describe('holding a Teleport tile (upgradeSlot)', () => {
  it('turns Teleport into Unleashed Teleport and back', () => {
    const up = reducer(initialState, { type: 'upgradeSlot', key: 'TOP-2' });
    expect(up.loadout.TOP).toEqual(['flash', 'ghost', 'unleashedTeleport']);
    const down = reducer(up, { type: 'upgradeSlot', key: 'TOP-2' });
    expect(down.loadout.TOP).toEqual(['flash', 'ghost', 'teleport']);
  });

  it('does nothing to spells without an upgrade, or in edit mode', () => {
    expect(reducer(initialState, { type: 'upgradeSlot', key: 'TOP-0' })).toBe(initialState);
    const editing = reducer(initialState, { type: 'toggleEdit' });
    expect(reducer(editing, { type: 'upgradeSlot', key: 'TOP-2' })).toBe(editing);
  });

  it("keeps a running timer, and the next timer uses Unleashed Teleport's cooldown", () => {
    let s = reducer(initialState, { type: 'tapSlot', key: 'TOP-2', spell: 'teleport', now: NOW });
    s = reducer(s, { type: 'upgradeSlot', key: 'TOP-2' });
    expect(s.timers['TOP-2']).toEqual({ endsAt: NOW + 300_000, total: 300 });
    s = reducer(s, { type: 'clearTimer', key: 'TOP-2' });
    s = reducer(s, { type: 'tapSlot', key: 'TOP-2', spell: 'unleashedTeleport', now: NOW });
    expect(s.timers['TOP-2']).toEqual({ endsAt: NOW + 330_000, total: 330 });
  });
});
