import { act, render, screen, userEvent } from '@testing-library/react-native';
import SpellTile, { formatRemaining } from '../components/SpellTile';

describe('formatRemaining', () => {
  it.each([
    [300, '5:00'],
    [270, '4:30'],
    [61, '1:01'],
    [60, '1:00'],
    [59.2, '1:00'], // rounds up, so it never shows 0 while time is left
    [59, '59'],
    [9.5, '10'],
    [0.1, '1'],
  ])('%p seconds -> %p', (seconds, expected) => {
    expect(formatRemaining(seconds)).toBe(expected);
  });
});

describe('formatRemaining in seconds mode', () => {
  it.each([
    [300, '300'],
    [245, '245'],
    [59.2, '60'],
    [9.5, '10'],
  ])('%p seconds -> %p', (seconds, expected) => {
    expect(formatRemaining(seconds, 'seconds')).toBe(expected);
  });
});

describe('SpellTile', () => {
  const NOW = new Date('2026-09-23T12:00:00Z').getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows no countdown when ready', async () => {
    await render(<SpellTile spell="flash" label="TOP Flash" />);
    const tile = screen.getByRole('button', { name: 'TOP Flash' });
    expect(tile).not.toBeBusy();
    expect(tile).toHaveTextContent('');
  });

  it('shows the countdown while running and ticks down with the clock', async () => {
    await render(<SpellTile spell="flash" label="TOP Flash" timer={{ endsAt: NOW + 300_000, total: 300 }} />);
    expect(screen.getByRole('button', { name: 'TOP Flash' })).toBeBusy();
    expect(screen.getByText('5:00')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(screen.getByText('4:59')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(240_000);
    });
    expect(screen.getByText('59')).toBeOnTheScreen();
  });

  it('catches up after the app was asleep, because time comes from endsAt', async () => {
    await render(<SpellTile spell="flash" label="TOP Flash" timer={{ endsAt: NOW + 300_000, total: 300 }} />);
    // Simulate the phone being locked: the clock jumps without intervals firing.
    jest.setSystemTime(NOW + 60_000);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByText('4:00')).toBeOnTheScreen();
  });

  it('calls onExpire when the cooldown runs out', async () => {
    const onExpire = jest.fn();
    await render(
      <SpellTile spell="smite" label="JG Smite" timer={{ endsAt: NOW + 90_000, total: 90 }} onExpire={onExpire} />,
    );
    expect(onExpire).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });
    expect(onExpire).toHaveBeenCalled();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<SpellTile spell="heal" label="BOT Heal" onPress={onPress} />);
    await user.press(screen.getByRole('button', { name: 'BOT Heal' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
