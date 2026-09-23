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

  it('edit mode: select a slot, swap in a spell from the pool, then finish editing', async () => {
    const user = userEvent.setup();
    await render(<App />);
    const pencil = screen.getByRole('button', { name: 'Edit spells' });
    expect(screen.queryByText(/Edit mode: tap a slot/)).not.toBeOnTheScreen();

    await user.press(pencil);
    expect(pencil).toBeSelected();
    expect(screen.getByText(/Edit mode: tap a slot/)).toBeOnTheScreen();
    expect(screen.getByText('Tap pencil again to finish editing')).toBeOnTheScreen();

    // Tapping a slot selects it, it doesn't start a timer.
    const teleport = screen.getByRole('button', { name: 'TOP Teleport' });
    await user.press(teleport);
    expect(teleport).toBeSelected();
    expect(teleport).not.toBeBusy();

    await user.press(screen.getByRole('button', { name: 'Swap in Ignite' }));
    expect(screen.queryByRole('button', { name: 'TOP Teleport' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'TOP Ignite' })).toBeSelected();

    await user.press(pencil);
    expect(pencil).not.toBeSelected();
    expect(screen.queryByText(/Edit mode: tap a slot/)).not.toBeOnTheScreen();

    // Back in track mode the new spell uses its own cooldown.
    await user.press(screen.getByRole('button', { name: 'TOP Ignite' }));
    expect(screen.getByText('3:00')).toBeOnTheScreen();
  });

  it('swapping a spell resets a running timer on that slot', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByRole('button', { name: 'BOT Heal' }));
    expect(screen.getByText('4:00')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Edit spells' }));
    await user.press(screen.getByRole('button', { name: 'BOT Heal' }));
    await user.press(screen.getByRole('button', { name: 'Swap in Barrier' }));

    expect(screen.getByRole('button', { name: 'BOT Barrier' })).not.toBeBusy();
    expect(screen.queryByText('4:00')).not.toBeOnTheScreen();
  });
});
