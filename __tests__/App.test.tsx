import { act, render, screen, userEvent } from '@testing-library/react-native';
import App from '../App';
import { contentWidthFor, poolTileFor, ROW_GAP, ROW_PADDING_COMPACT, tileSizeFor } from '../hooks/useLayout';

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
    expect(screen.getByText('SUMMONER')).toBeOnTheScreen();
    expect(screen.getByText('Spell Tracker')).toBeOnTheScreen();
    expect(screen.getByText('Jungle')).toBeOnTheScreen();
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
    expect(screen.queryByText('Spell pool')).not.toBeOnTheScreen();

    await user.press(pencil);
    expect(pencil).toBeSelected();
    expect(screen.getByText('Spell pool')).toBeOnTheScreen();
    expect(screen.getByText('Tap a slot above, then a spell here to swap it in.')).toBeOnTheScreen();
    expect(screen.getByText('Tap the pencil again to finish editing')).toBeOnTheScreen();

    // Tapping a slot selects it, it doesn't start a timer.
    const teleport = screen.getByRole('button', { name: 'TOP Teleport' });
    await user.press(teleport);
    expect(teleport).toBeSelected();
    expect(teleport).not.toBeBusy();
    expect(screen.getByText('Tap a spell to swap it into the highlighted slot.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Swap in Ignite' }));
    expect(screen.queryByRole('button', { name: 'TOP Teleport' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'TOP Ignite' })).not.toBeSelected();
    // Selection moves down the column, ready for the next pick.
    expect(screen.getByRole('button', { name: 'JG Smite' })).toBeSelected();

    await user.press(pencil);
    expect(pencil).not.toBeSelected();
    expect(screen.queryByText('Spell pool')).not.toBeOnTheScreen();

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

describe('tile sizing', () => {
  // Pixel 7: ~412dp wide; content width after screen padding is 380.
  const width = contentWidthFor(412);

  it('fills a typical phone with tiles far bigger than the old 64dp', () => {
    // ~870dp usable minus header (~80), hint (~34) and screen padding (32).
    const size = tileSizeFor(width, 870 - 80 - 34 - 32);
    expect(size).toBeGreaterThanOrEqual(90);
    expect(size).toBeLessThanOrEqual(128);
  });

  it('never goes below 48dp or above 128dp', () => {
    expect(tileSizeFor(contentWidthFor(320), 100)).toBe(48);
    expect(tileSizeFor(contentWidthFor(1200), 5000)).toBeLessThanOrEqual(128);
  });

  it('edit mode shrinks the rows so the spell pool fits on the same screen', () => {
    const rowsNormal = 870 - 80 - 34 - 32;
    const pool = 14 * 2 + 50 + (poolTileFor(width) + 20) * 2 + 8 + 4;
    const rowsEditing = rowsNormal - pool;
    const tile = tileSizeFor(width, rowsEditing, ROW_PADDING_COMPACT);
    expect(tile).toBeLessThan(tileSizeFor(width, rowsNormal));
    // Five rows at that size, plus their padding and gaps, fit the space left.
    expect(5 * (tile + ROW_PADDING_COMPACT * 2 + ROW_GAP)).toBeLessThanOrEqual(rowsEditing);
  });

  it('pool tiles fit five to a row', () => {
    expect(poolTileFor(width) * 5 + 10 * 4 + 14 * 2).toBeLessThanOrEqual(width);
  });
});
