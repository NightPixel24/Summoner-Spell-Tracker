import { render, screen, userEvent } from '@testing-library/react-native';
import App from '../App';

describe('Holding Teleport to switch to Unleashed Teleport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-24T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('TOP has a third slot, which starts as Unleashed Teleport', async () => {
    await render(<App />);
    expect(screen.getByRole('button', { name: 'TOP Flash' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'TOP Ghost' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'TOP Unleashed Teleport' })).toBeOnTheScreen();
  });

  it('holding switches between Unleashed Teleport and Teleport, each with its own cooldown', async () => {
    const user = userEvent.setup();
    await render(<App />);

    const unleashed = screen.getByRole('button', { name: 'TOP Unleashed Teleport' });
    await user.press(unleashed);
    expect(screen.getByText('5:30')).toBeOnTheScreen(); // 330s
    await user.press(unleashed); // reset

    await user.longPress(unleashed);
    const teleport = screen.getByRole('button', { name: 'TOP Teleport' });
    expect(teleport).not.toBeBusy(); // a hold changes the spell, it doesn't start a timer
    await user.press(teleport);
    expect(screen.getByText('5:00')).toBeOnTheScreen(); // 300s
    await user.press(teleport); // reset

    await user.longPress(teleport);
    expect(screen.getByRole('button', { name: 'TOP Unleashed Teleport' })).toBeOnTheScreen();
  });

  it('holding a spell without an upgrade just counts as a tap', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.longPress(screen.getByRole('button', { name: 'TOP Flash' }));
    expect(screen.getByRole('button', { name: 'TOP Flash' })).toBeBusy(); // same spell, timer started
  });

  it('holding does nothing in edit mode', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByRole('button', { name: 'Edit spells' }));
    await user.longPress(screen.getByRole('button', { name: 'TOP Unleashed Teleport' }));
    expect(screen.getByRole('button', { name: 'TOP Unleashed Teleport' })).toBeOnTheScreen();
  });

  it('Unleashed Teleport is not in the spell pool but is in Settings', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByRole('button', { name: 'Edit spells' }));
    expect(screen.queryByRole('button', { name: 'Swap in Unleashed Teleport' })).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Edit spells' }));

    await user.press(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByLabelText('Unleashed Teleport cooldown in seconds')).toHaveDisplayValue('330');
  });
});
