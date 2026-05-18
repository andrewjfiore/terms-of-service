import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../App';

describe('Wizard end-to-end (Elden Ring on AYN Odin 3)', () => {
  it('walks device -> game -> priorities -> exported .container', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: device
    await user.click(screen.getByRole('button', { name: 'AYN Odin 3' }));
    expect(screen.getByText(/Tier A/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 2: game
    await user.type(
      screen.getByPlaceholderText('Type a game title…'),
      'Elden Ring'
    );
    await user.click(
      screen.getByRole('button', { name: /Elden Ring/i })
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 3: priorities
    await user.click(screen.getByRole('button', { name: /Build config/i }));

    // Step 4: result
    expect(screen.getByText('Resolved settings')).toBeInTheDocument();
    const pre = screen.getByText(/"containerVariant": "bionic"/);
    expect(pre).toBeInTheDocument();
    expect(within(pre).getByText(/proton-10\.0-arm64ec-2/)).toBeTruthy;
    expect(pre.textContent).toContain('"dxwrapper": "vkd3d"');
    expect(pre.textContent).toContain('"emulator": "FEXCore"');
    expect(
      screen.getByRole('button', { name: 'Download .container' })
    ).toBeInTheDocument();
    // EAC caveat surfaced via the curated profile note
    expect(screen.getByText(/EAC blocks online/)).toBeInTheDocument();
  });
});
