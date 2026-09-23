import { act, render, screen, userEvent } from '@testing-library/react-native';
import App from '../App';

describe('Tracker screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-23T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the header and the default loadout for all five roles', async () => {
    await render(<App />);
    expect(screen.getByText('SUMMONER\nSPELL TRACKER')).toBeOnTheScreen();
    for (const label of [
      'TOP Flash', 'TOP Teleport',
      'JG Flash', 'JG Smite',
      'MID Flash', 'MID Ignite',
      'BOT Flash', 'BOT Heal',
      'SUP Flash', 'SUP Exhaust',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
  });

  it('tap starts a cooldown and a second tap resets it', async () => {
    const user = userEvent.setup();
    await render(<App />);
    const flash = screen.getByRole('button', { name: 'TOP Flash' });

    await user.press(flash);
    expect(flash).toBeBusy();
    expect(screen.getByText('5:00')).toBeOnTheScreen();

    await user.press(flash);
    expect(flash).not.toBeBusy();
    expect(screen.queryByText(/:\d\d$/)).not.toBeOnTheScreen();
  });

  it('runs timers for different slots independently', async () => {
    const user = userEvent.setup();
    await render(<App />);

    await user.press(screen.getByRole('button', { name: 'JG Smite' }));
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    await user.press(screen.getByRole('button', { name: 'MID Ignite' }));

    expect(screen.getByText('1:00')).toBeOnTheScreen(); // Smite: 90s - 30s
    expect(screen.getByText('3:00')).toBeOnTheScreen(); // Ignite: fresh 180s

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('button', { name: 'JG Smite' })).not.toBeBusy(); // back up
    expect(screen.getByText('2:00')).toBeOnTheScreen(); // Ignite still running
  });
});
