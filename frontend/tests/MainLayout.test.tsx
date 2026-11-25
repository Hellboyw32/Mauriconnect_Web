import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../src/layouts/MainLayout';
import { theme } from '../src/theme/theme';

describe('MainLayout', () => {
  afterEach(() => vi.restoreAllMocks());

  it('survives a window.scrollTo that returns a value (patched by extensions or polyfills)', async () => {
    // Returning this from an effect would make React call it as a cleanup function and crash.
    vi.spyOn(window, 'scrollTo').mockImplementation((() => ({ not: 'a function' })) as unknown as typeof window.scrollTo);
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<p>Home page</p>} />
              <Route path="about" element={<p>About page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByText('Home page')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('link', { name: 'About us' })[0]);
    expect(await screen.findByText('About page')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
