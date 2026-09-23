import { render, screen, userEvent } from '@testing-library/react-native';
import App from '../App';
import { RIOT_DISCLAIMER } from '../components/SettingsSheet';

async function openSettings() {
  const user = userEvent.setup();
  await render(<App />);
  await user.press(screen.getByRole('button', { name: 'Settings' }));
  return user;
}

describe('Settings sheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-23T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens from the cog and lists every spell cooldown, plus the Riot disclaimer', async () => {
    await openSettings();
    expect(screen.getByText('Cooldowns (seconds)')).toBeOnTheScreen();
    expect(screen.getByLabelText('Flash cooldown in seconds')).toHaveDisplayValue('300');
    expect(screen.getByLabelText('Teleport cooldown in seconds')).toHaveDisplayValue('360');
    expect(screen.getByLabelText('Smite cooldown in seconds')).toHaveDisplayValue('90');
    expect(screen.getByText(RIOT_DISCLAIMER)).toBeOnTheScreen();
  });

  it('Flash set to 270 makes the next Flash timer 4:30', async () => {
    const user = await openSettings();
    await user.type(screen.getByLabelText('Flash cooldown in seconds'), '270');
    await user.press(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByText('Cooldowns (seconds)')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'TOP Flash' }));
    expect(screen.getByText('4:30')).toBeOnTheScreen();
  });

  it('focusing a field clears it so typing replaces the old value', async () => {
    const user = await openSettings();
    const smite = screen.getByLabelText('Smite cooldown in seconds');
    await user.type(smite, '75');
    expect(smite).toHaveDisplayValue('75');
  });

  it('a blank or invalid entry is not saved and reverts on blur', async () => {
    const user = await openSettings();
    const flash = screen.getByLabelText('Flash cooldown in seconds');
    await user.type(flash, '0'); // user.type blurs the field when it finishes
    expect(flash).toHaveDisplayValue('300');

    await user.press(screen.getByRole('button', { name: 'Done' }));
    await user.press(screen.getByRole('button', { name: 'TOP Flash' }));
    expect(screen.getByText('5:00')).toBeOnTheScreen();
  });

  it('Reset defaults puts every value back', async () => {
    const user = await openSettings();
    await user.type(screen.getByLabelText('Flash cooldown in seconds'), '270');
    await user.type(screen.getByLabelText('Heal cooldown in seconds'), '200');
    await user.press(screen.getByRole('button', { name: 'Reset defaults' }));

    expect(screen.getByLabelText('Flash cooldown in seconds')).toHaveDisplayValue('300');
    expect(screen.getByLabelText('Heal cooldown in seconds')).toHaveDisplayValue('240');
  });
});
