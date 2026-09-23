import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';
import { DEFAULT_LOADOUT, ROLES, Role, SLOTS_PER_ROLE, SPELLS, SPELL_IDS, SpellId, UPGRADES } from '../data/spells';

export type Slot = 0 | 1 | 2; // 2 only exists for TOP
export type SlotKey = `${Role}-${Slot}`;

export interface Timer {
  endsAt: number; // epoch ms
  total: number; // seconds the timer was started with
}

// How countdowns read: minutes ("4:05") or plain seconds ("245").
export type TimeFormat = 'minutes' | 'seconds';

export interface AppState {
  loadout: Record<Role, SpellId[]>; // SLOTS_PER_ROLE[role] spells each
  cooldowns: Record<SpellId, number>; // seconds, user-editable
  timers: Partial<Record<SlotKey, Timer>>;
  timeFormat: TimeFormat;
  mode: 'track' | 'edit';
  selectedSlot: SlotKey | null;
}

export type Action =
  | { type: 'tapSlot'; key: SlotKey; spell: SpellId; now: number }
  | { type: 'clearTimer'; key: SlotKey }
  | { type: 'toggleEdit' }
  | { type: 'upgradeSlot'; key: SlotKey }
  | { type: 'assignSpell'; spell: SpellId }
  | { type: 'setCooldown'; spell: SpellId; seconds: number }
  | { type: 'resetCooldowns' }
  | { type: 'setTimeFormat'; format: TimeFormat };

// Longest cooldown the settings accept: an hour is far beyond any summoner spell.
export const MAX_COOLDOWN = 3600;

export const isValidCooldown = (seconds: number) =>
  Number.isInteger(seconds) && seconds > 0 && seconds <= MAX_COOLDOWN;

export const slotKey = (role: Role, slot: Slot): SlotKey => `${role}-${slot}`;

// Every slot that exists, row by row.
export const slotsFor = (role: Role): Slot[] => ([0, 1, 2] as Slot[]).slice(0, SLOTS_PER_ROLE[role]);

// Edit-mode order: down the first column (TOP..SUP), then down the second, then TOP's third.
export const SLOT_ORDER: SlotKey[] = ([0, 1, 2] as Slot[]).flatMap((slot) =>
  ROLES.filter((role) => slot < SLOTS_PER_ROLE[role]).map((role) => slotKey(role, slot)),
);

// The slot after `key` in that order, or null once the bottom-right slot is done.
export const nextSlot = (key: SlotKey): SlotKey | null => SLOT_ORDER[SLOT_ORDER.indexOf(key) + 1] ?? null;

export const defaultCooldowns = (): Record<SpellId, number> =>
  Object.fromEntries(SPELL_IDS.map((id) => [id, SPELLS[id].cooldown])) as Record<SpellId, number>;

export const initialState: AppState = {
  loadout: DEFAULT_LOADOUT,
  cooldowns: defaultCooldowns(),
  timers: {},
  timeFormat: 'minutes',
  mode: 'track',
  selectedSlot: null,
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'tapSlot': {
      // Edit mode: tap selects a slot (tap it again to deselect). Timers are untouched.
      if (state.mode === 'edit') {
        return { ...state, selectedSlot: state.selectedSlot === action.key ? null : action.key };
      }
      // Track mode: tap toggles. A running timer resets to ready, a ready slot starts its cooldown.
      const running = state.timers[action.key];
      if (running && running.endsAt > action.now) return reducer(state, { type: 'clearTimer', key: action.key });
      const total = state.cooldowns[action.spell];
      return {
        ...state,
        timers: { ...state.timers, [action.key]: { endsAt: action.now + total * 1000, total } },
      };
    }
    case 'clearTimer': {
      if (!state.timers[action.key]) return state;
      const { [action.key]: _removed, ...rest } = state.timers;
      return { ...state, timers: rest };
    }
    case 'toggleEdit':
      return { ...state, mode: state.mode === 'edit' ? 'track' : 'edit', selectedSlot: null };
    case 'upgradeSlot': {
      // Holding a Teleport tile turns it into Unleashed Teleport (and back, for a mis-press).
      // A running timer keeps counting; the next one uses the new spell's cooldown.
      if (state.mode === 'edit') return state;
      const [role, slot] = action.key.split('-') as [Role, `${Slot}`];
      const upgraded = UPGRADES[state.loadout[role][Number(slot)]];
      if (!upgraded) return state;
      const spells = [...state.loadout[role]];
      spells[Number(slot)] = upgraded;
      return { ...state, loadout: { ...state.loadout, [role]: spells } };
    }
    case 'assignSpell': {
      // Swap a pool spell into the selected slot, reset that slot's timer (it's a different
      // spell now) and move the selection on to the next slot, so a whole loadout can be
      // entered by tapping pool spells in a row.
      const key = state.selectedSlot;
      if (state.mode !== 'edit' || !key) return state;
      const [role, slot] = key.split('-') as [Role, `${Slot}`];
      const spells = [...state.loadout[role]];
      spells[Number(slot)] = action.spell;
      const { [key]: _removed, ...timers } = state.timers;
      return { ...state, loadout: { ...state.loadout, [role]: spells }, timers, selectedSlot: nextSlot(key) };
    }
    // New cooldowns apply to the next timer started; running timers keep their own `total`.
    case 'setCooldown':
      if (!isValidCooldown(action.seconds)) return state;
      return { ...state, cooldowns: { ...state.cooldowns, [action.spell]: action.seconds } };
    case 'resetCooldowns':
      return { ...state, cooldowns: defaultCooldowns() };
    case 'setTimeFormat':
      return { ...state, timeFormat: action.format };
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children, initial = initialState }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
