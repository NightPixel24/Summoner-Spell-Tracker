import { DEFAULT_LOADOUT, ROLES, SPELLS, SPELL_IDS } from '../data/spells';

describe('spell data', () => {
  it('has all nine Summoner\'s Rift spells, each with a cooldown and both icons', () => {
    expect(SPELL_IDS).toHaveLength(9);
    for (const id of SPELL_IDS) {
      const spell = SPELLS[id];
      expect(spell.id).toBe(id);
      expect(spell.cooldown).toBeGreaterThan(0);
      expect(spell.icon).toBeTruthy();
      expect(spell.iconGrey).toBeTruthy();
      expect(spell.iconGrey).not.toBe(spell.icon);
    }
  });

  it('default loadout covers every role with known spells', () => {
    for (const role of ROLES) {
      expect(DEFAULT_LOADOUT[role]).toHaveLength(2);
      for (const id of DEFAULT_LOADOUT[role]) expect(SPELLS[id]).toBeDefined();
    }
  });
});
