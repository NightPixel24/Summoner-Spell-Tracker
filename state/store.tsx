import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';
import { DEFAULT_LOADOUT, Role, SPELLS, SPELL_IDS, SpellId } from '../data/spells';

export type Slot = 0 | 1;
export type SlotKey = `${Role}-${Slot}`;

export interface Timer {
  endsAt: number; // epoch ms
  total: number; // seconds the timer was started with
}

export interface AppState {
  loadout: Record<Role, [SpellId, SpellId]>;
  cooldowns: Record<SpellId, number>; // seconds, user-editable
  timers: Partial<Record<SlotKey, Timer>>;
  mode: 'track' | 'edit';
  selectedSlot: SlotKey | null;
}

export type Action =
  | { type: 'tapSlot'; key: SlotKey; spell: SpellId; now: number }
  | { type: 'clearTimer'; key: SlotKey }
  | { type: 'toggleEdit' }
  | { type: 'assignSpell'; spell: SpellId };

export const slotKey = (role: Role, slot: Slot): SlotKey => `${role}-${slot}`;

export const defaultCooldowns = (): Record<SpellId, number> =>
  Object.fromEntries(SPELL_IDS.map((id) => [id, SPELLS[id].cooldown])) as Record<SpellId, number>;

export const initialState: AppState = {
  loadout: DEFAULT_LOADOUT,
  cooldowns: defaultCooldowns(),
  timers: {},
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
    case 'assignSpell': {
      // Swap a pool spell into the selected slot. The slot keeps its selection so the
      // user can try another spell, and its timer resets because it's a different spell now.
      const key = state.selectedSlot;
      if (state.mode !== 'edit' || !key) return state;
      const [role, slot] = key.split('-') as [Role, `${Slot}`];
      const spells: [SpellId, SpellId] = [...state.loadout[role]];
      spells[Number(slot)] = action.spell;
      const { [key]: _removed, ...timers } = state.timers;
      return { ...state, loadout: { ...state.loadout, [role]: spells }, timers };
    }
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
