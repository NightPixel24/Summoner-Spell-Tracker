import { DEFAULT_LOADOUT } from '../data/spells';
import { AppState, initialState, reducer } from '../state/store';

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

  it('assignSpell swaps the spell into the selected slot and keeps it selected', () => {
    const selected = reducer(editing, { type: 'tapSlot', key: 'TOP-1', spell: 'teleport', now: NOW });
    const next = reducer(selected, { type: 'assignSpell', spell: 'ignite' });
    expect(next.loadout.TOP).toEqual(['flash', 'ignite']);
    expect(next.loadout.MID).toEqual(DEFAULT_LOADOUT.MID);
    expect(next.selectedSlot).toBe('TOP-1');
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
