import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import App from '../App';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

describe('Haptics, ready feedback and keep-awake', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-23T12:00:00Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("doesn't buzz on the Settings buttons", async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByRole('button', { name: 'Settings' }));
    jest.mocked(Haptics.impactAsync).mockClear();
    for (const name of ['Reset loadout', 'Reset cooldowns', 'Done']) {
      await user.press(screen.getByRole('button', { name }));
    }
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('buzzes lightly on every tile tap', async () => {
    const user = userEvent.setup();
    await render(<App />);
    const flash = screen.getByRole('button', { name: 'TOP Flash' });
    await user.press(flash); // start
    await user.press(flash); // reset
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('buzzes with a success pattern when a cooldown runs out, but not on a manual reset', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByRole('button', { name: 'JG Smite' }));
    await user.press(screen.getByRole('button', { name: 'SUP Heal' }));
    await user.press(screen.getByRole('button', { name: 'SUP Heal' })); // reset: no "ready" buzz

    await act(async () => {
      jest.advanceTimersByTime(89_000);
    });
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(screen.getByRole('button', { name: 'JG Smite' })).not.toBeBusy();
  });

  it('keeps the screen awake only while a timer is running', async () => {
    const user = userEvent.setup();
    await render(<App />);
    expect(useKeepAwake).not.toHaveBeenCalled();

    const flash = screen.getByRole('button', { name: 'MID Flash' });
    await user.press(flash);
    expect(useKeepAwake).toHaveBeenCalledWith('spell-timers');

    (useKeepAwake as jest.Mock).mockClear();
    await user.press(flash); // reset: no timers left
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(useKeepAwake).not.toHaveBeenCalled();
  });
});
