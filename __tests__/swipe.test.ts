import { DISMISS_DISTANCE, shouldDismiss } from '../components/SettingsSheet';

describe('Swipe down to close Settings', () => {
  it('closes after a long enough pull or a quick flick, otherwise snaps back', () => {
    expect(shouldDismiss(DISMISS_DISTANCE + 1, 0)).toBe(true);
    expect(shouldDismiss(40, 1.5)).toBe(true);
    expect(shouldDismiss(40, 0.2)).toBe(false);
    expect(shouldDismiss(10, 2)).toBe(false);
    expect(shouldDismiss(-200, -3)).toBe(false); // dragged up
  });
});
