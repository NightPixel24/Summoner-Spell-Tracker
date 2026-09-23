import { act, render, screen, userEvent } from '@testing-library/react-native';
import App from '../App';

// Simulates closing the app and opening it again: unmount, let pending saves
// finish, then mount a fresh App that loads from storage.
async function restartApp(unmount: () => Promise<void>) {
  await unmount();
  await act(async () => {});
  await render(<App />);
}

describe('Saved state across restarts', () => {
  const START = new Date('2026-09-23T12:00:00Z').getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps an edited loadout and custom cooldowns', async () => {
    const user = userEvent.setup();
    const { unmount } = await render(<App />);

    await user.press(screen.getByRole('button', { name: 'Edit spells' }));
    await user.press(screen.getByRole('button', { name: 'TOP Ghost' }));
    await user.press(screen.getByRole('button', { name: 'Swap in Cleanse' }));
    await user.press(screen.getByRole('button', { name: 'Edit spells' }));

    await user.press(screen.getByRole('button', { name: 'Settings' }));
    await user.type(screen.getByLabelText('Flash cooldown in seconds'), '270');
    await user.press(screen.getByRole('button', { name: 'Done' }));

    await restartApp(unmount);

    expect(screen.getByRole('button', { name: 'TOP Cleanse' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'TOP Ghost' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Edit spells' })).not.toBeSelected(); // edit mode isn't saved

    await user.press(screen.getByRole('button', { name: 'MID Flash' }));
    expect(screen.getByText('4:30')).toBeOnTheScreen();
  });

  it('keeps a running timer, with time that passed while the app was closed taken off', async () => {
    const user = userEvent.setup();
    const { unmount } = await render(<App />);
    await user.press(screen.getByRole('button', { name: 'TOP Flash' }));
    expect(screen.getByText('5:00')).toBeOnTheScreen();

    await unmount();
    await act(async () => {});
    jest.setSystemTime(Date.now() + 60_000); // app closed for a minute (press already advanced the clock a little)
    await render(<App />);

    expect(screen.getByRole('button', { name: 'TOP Flash' })).toBeBusy();
    expect(screen.getByText('4:00')).toBeOnTheScreen();
  });

  it('shows a spell as ready if its cooldown ended while the app was closed', async () => {
    const user = userEvent.setup();
    const { unmount } = await render(<App />);
    await user.press(screen.getByRole('button', { name: 'JG Smite' }));

    await unmount();
    await act(async () => {});
    jest.setSystemTime(Date.now() + 90_000); // Smite is 90s
    await render(<App />);

    expect(screen.getByRole('button', { name: 'JG Smite' })).not.toBeBusy();
  });

  it('a reset timer stays reset after a restart', async () => {
    const user = userEvent.setup();
    const { unmount } = await render(<App />);
    const heal = screen.getByRole('button', { name: 'SUP Heal' });
    await user.press(heal);
    await user.press(heal);

    await restartApp(unmount);
    expect(screen.getByRole('button', { name: 'SUP Heal' })).not.toBeBusy();
  });
});
