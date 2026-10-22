import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MotionConfig, LazyMotion, domAnimation } from 'motion/react';
import { NotificationProvider } from '@/components/ui/notification';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/app';
import { ThemeProvider } from '@/app/theme';

function renderApp(path = '/app') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="always">
            <NotificationProvider>
              <RouterProvider router={router} />
            </NotificationProvider>
          </MotionConfig>
        </LazyMotion>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { client, router, unmount: view.unmount };
}
const healthyFetch = () =>
  vi.fn().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.startsWith('/api/scans') ? { items: [], nextCursor: null } : { status: 'ok' },
  }));

describe('foundation workspace', () => {
  it('saves once, prevents duplicate submissions, and displays queued metadata', async () => {
    const row = {
      id: 'e99da136-2b5a-4f41-b149-a7b07ce41001',
      url: 'https://example.com',
      normalizedUrl: 'https://example.com/',
      status: 'queued',
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-22T00:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
      errorSummary: null,
    };
    let finish: ((response: unknown) => void) | undefined;
    const fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST')
        return new Promise((resolve) => {
          finish = resolve;
        });
      return {
        ok: true,
        json: async () =>
          url === '/api/health'
            ? { status: 'ok' }
            : url.includes(row.id)
              ? row
              : { items: [], nextCursor: null },
      };
    });
    vi.stubGlobal('fetch', fetch);
    renderApp('/app/new');
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText('Website URL'));
    await user.paste('https://example.com');
    await user.click(screen.getByRole('button', { name: 'Create scan job' }));
    expect(screen.getByRole('button', { name: 'Saving job…' })).toBeDisabled();
    expect(screen.getByLabelText('Website URL')).toBeDisabled();
    finish?.({ ok: true, json: async () => row });
    expect(await screen.findByRole('heading', { name: 'Scan details' })).toBeInTheDocument();
    expect(await screen.findByText(/Queued — awaiting the scanning engine/)).toBeInTheDocument();
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  });
  it('announces rejected URL intake and allows correction', async () => {
    const fetch = healthyFetch();
    fetch.mockImplementation(async (url: string, options?: RequestInit) =>
      options?.method === 'POST'
        ? {
            ok: false,
            json: async () => ({
              error: {
                code: 'URL_NOT_ALLOWED',
                message: 'Use an approved public website.',
                requestId: 'test',
              },
            }),
          }
        : {
            ok: true,
            json: async () =>
              url === '/api/health' ? { status: 'ok' } : { items: [], nextCursor: null },
          },
    );
    vi.stubGlobal('fetch', fetch);
    renderApp('/app/new');
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText('Website URL'));
    await user.paste('https://unapproved.com');
    await user.click(screen.getByRole('button', { name: 'Create scan job' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Use an approved public website.');
    expect(screen.getByLabelText('Website URL')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Create scan job' })).toBeEnabled();
  });
  it('enables queued-job intake without automatically submitting a URL', async () => {
    const fetch = healthyFetch();
    vi.stubGlobal('fetch', fetch);
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByLabelText('Website URL')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Create scan job' })).toBeDisabled();
    expect(screen.getByText(/no website is visited/)).toBeInTheDocument();
    expect(await screen.findByText('API online')).toBeInTheDocument();
    expect(
      fetch.mock.calls.every(([, options]) => !options?.method || options.method === 'GET'),
    ).toBe(true);
  });
  it('shows an honest pending state while health is unresolved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    const { client } = renderApp();
    expect(await screen.findByText('Checking API…')).toBeInTheDocument();
    expect(screen.queryByText('API online')).not.toBeInTheDocument();
    client.clear();
  });
  it('supports retry after API failure', async () => {
    let failed = false;
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/health' && !failed) {
        failed = true;
        throw new Error('Network unavailable');
      }
      return {
        ok: true,
        json: async () =>
          url === '/api/health' ? { status: 'ok' } : { items: [], nextCursor: null },
      };
    });
    vi.stubGlobal('fetch', fetch);
    renderApp();
    expect(await screen.findByText('API unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry API connection' }));
    expect(await screen.findByText('API online')).toBeInTheDocument();
  });
  it('stores a theme choice and restores it after remount', async () => {
    vi.stubGlobal('fetch', healthyFetch());
    const { unmount } = renderApp('/app/workspace');
    await screen.findByRole('heading', { name: 'Your workspace' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Switch to dark theme' })[0]!);
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('accesslens-theme')).toBe('dark');
    unmount();
    renderApp('/app/workspace');
    expect(screen.getAllByRole('button', { name: 'Switch to light theme' })).toHaveLength(2);
  });
  it('navigates with current-page semantics and focuses the new main content', async () => {
    vi.stubGlobal('fetch', healthyFetch());
    renderApp();
    await userEvent.click(screen.getByRole('link', { name: 'Scan history' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Scan history' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scan history' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
    expect(await screen.findByText('No scan history yet')).toBeInTheDocument();
  });
  it('provides a recoverable not-found page', async () => {
    vi.stubGlobal('fetch', healthyFetch());
    renderApp('/app/missing');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to overview' })).toHaveAttribute('href', '/app');
  });
  it('keeps the public homepage separate and makes no health or scan requests', async () => {
    const fetch = healthyFetch();
    vi.stubGlobal('fetch', fetch);
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Find accessibility issues. Fix them with confidence.',
    );
    expect(
      screen.queryByRole('complementary', { name: 'Workspace sidebar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('API online')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Button names/ }));
    expect(screen.getByRole('heading', { name: 'Make the action clear.' })).toBeInTheDocument();
    expect(screen.getByText(/Example content, not live scan results/)).toBeInTheDocument();
  });
  it('moves from the public CTA into the clearly labeled app preview', async () => {
    vi.stubGlobal('fetch', healthyFetch());
    renderApp('/');
    await userEvent.click(await screen.findByRole('link', { name: 'Explore the workspace' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('You’re exploring the workspace preview.')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Workspace sidebar' })).toBeInTheDocument();
  });
  it('redirects existing history links into the application namespace', async () => {
    vi.stubGlobal('fetch', healthyFetch());
    const { router } = renderApp('/history');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Scan history' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/history');
  });
});
