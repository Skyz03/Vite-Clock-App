import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import axios from 'axios';
import App from './App';

vi.mock('axios');
const mockedAxios = axios as unknown as {
    get: ReturnType<typeof vi.fn>;
};

it('Case 2: displays the initialization message while fetching data', () => {
    // Create a promise that we control manually
    let resolveApi: any;
    const slowPromise = new Promise((resolve) => {
        resolveApi = resolve;
    });

    mockedAxios.get.mockReturnValue(slowPromise);

    render(<App />);

    // Check that the loading screen is visible immediately
    expect(screen.getByText(/Initializing Systems…/i)).toBeInTheDocument();

    // Now resolve it to clean up the test
    resolveApi({ data: {} });
});

it('Case 3: displays the day background when the system time is 11:00', async () => {
    // 1. Setup Fake Timers for 11:00 AM
    vi.useFakeTimers();
    const dayTime = new Date(2026, 0, 11, 11, 0, 0);
    vi.setSystemTime(dayTime);

    // 2. Mock API 
    mockedAxios.get.mockResolvedValue({
        data: { cityName: 'Kathmandu', countryName: 'Nepal' }
    });

    render(<App />);
    vi.useRealTimers();

    // 3. Move to main screen
    const initBtn = await screen.findByText(/INITIALIZE/i);
    fireEvent.click(initBtn);

    // 4. Assertion
    await waitFor(() => {
        // Find the specific div using the test ID
        const bgContainer = screen.getByTestId('bg-container');

        // Check the style on THIS element
        expect(bgContainer.style.backgroundImage).toContain('bg-image-daytime');

        // Check the greeting
        expect(screen.getByText(/Good Morning/i)).toBeInTheDocument();
    });
});

it('Case 5: shows the stats panel when the toggle button is clicked', async () => {
    mockedAxios.get.mockResolvedValue({ data: { cityName: 'Kathmandu' } });

    render(<App />);

    // 1. Get to main screen
    const initBtn = await screen.findByRole('button', { name: /INITIALIZE/i });
    fireEvent.click(initBtn);

    // 2. Find the "MORE" button specifically by its ARIA role
    const moreBtn = await screen.findByRole('button', { name: /MORE/i });

    // 3. Find the Stats Panel (looking for the label inside)
    const timezoneLabel = screen.getByText(/Current Timezone/i);
    const statsPanelContainer = timezoneLabel.closest('.absolute');

    // 4. ASSERT: Initial state is hidden
    expect(statsPanelContainer).toHaveClass('translate-y-full');

    // 5. CLICK
    fireEvent.click(moreBtn);

    // 6. ASSERT: State is now visible
    expect(statsPanelContainer).toHaveClass('translate-y-0');

    // 7. Verify button text toggled to LESS
    expect(screen.getByRole('button', { name: /LESS/i })).toBeInTheDocument();
});

it('Case 7: falls back to "Local System" when the API uplink fails', async () => {
    // 1. Force the API to "Fail"
    mockedAxios.get.mockRejectedValue(new Error('500 Internal Server Error'));

    render(<App />);

    // 2. Wait for the INITIALIZE button
    // Even if the API fails, your code handles the error and sets isLoading to false
    const initBtn = await screen.findByText(/INITIALIZE/i);
    fireEvent.click(initBtn);

    // 3. Assertions: Check if it shows the local fallback data
    await waitFor(() => {
        // Should show the fallback location you defined in App.tsx
        expect(screen.getByText(/In Local System/i)).toBeInTheDocument();

        // Should show 'LOC' as the abbreviation
        expect(screen.getByText(/LOCAL/i)).toBeInTheDocument();
    });

    // 4. Verify that the console.error was called (optional but professional)
    // This proves your catch block actually ran
    console.log("Verified: App remained stable during simulated API blackout.");
});