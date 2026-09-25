import { DEFAULT_LOADOUT, POOL_SPELL_IDS, ROLES, SLOTS_PER_ROLE, SPELLS, SPELL_IDS, UPGRADES } from '../data/spells';

describe('spell data', () => {
  it("has the nine pickable Summoner's Rift spells plus Unleashed Teleport, each with a cooldown and both icons", () => {
    expect(POOL_SPELL_IDS).toHaveLength(10);
    expect(POOL_SPELL_IDS[9]).toBe('unleashedTeleport');
    expect(SPELL_IDS).toHaveLength(10);
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
      expect(DEFAULT_LOADOUT[role]).toHaveLength(SLOTS_PER_ROLE[role]);
      expect(DEFAULT_LOADOUT[role][0]).toBe('flash');
      for (const id of DEFAULT_LOADOUT[role]) expect(SPELLS[id]).toBeDefined();
    }
  });

  it('uses the agreed default loadout, with a third slot for TOP only', () => {
    expect(DEFAULT_LOADOUT).toEqual({
      TOP: ['flash', 'ghost', 'unleashedTeleport'],
      JG: ['flash', 'smite'],
      MID: ['flash', 'ignite'],
      BOT: ['flash', 'barrier'],
      SUP: ['flash', 'heal'],
    });
  });

  it('Teleport and Unleashed Teleport swap into each other', () => {
    expect(UPGRADES.teleport).toBe('unleashedTeleport');
    expect(UPGRADES.unleashedTeleport).toBe('teleport');
    expect(SPELLS.unleashedTeleport.cooldown).toBe(330);
  });
});
