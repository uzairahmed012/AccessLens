import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, Navigate, RouterProvider } from 'react-router';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
const AppShell = lazy(() =>
  import('@/components/app-shell').then((component) => ({ default: component.AppShell })),
);
const LandingPage = lazy(() =>
  import('@/routes/landing').then((page) => ({ default: page.LandingPage })),
);
const OverviewPage = lazy(() =>
  import('@/routes/overview').then((page) => ({ default: page.OverviewPage })),
);
const HistoryPage = lazy(() =>
  import('@/routes/history').then((page) => ({ default: page.HistoryPage })),
);
const WorkspacePage = lazy(() =>
  import('@/routes/workspace').then((page) => ({ default: page.WorkspacePage })),
);
const GuidePage = lazy(() =>
  import('@/routes/guide').then((page) => ({ default: page.GuidePage })),
);
const ScanPage = lazy(() => import('@/routes/scan').then((page) => ({ default: page.ScanPage })));
const FindingsPage = lazy(() =>
  import('@/routes/findings').then((page) => ({ default: page.FindingsPage })),
);
const ScanDetailsPage = lazy(() =>
  import('@/routes/scan-details').then((page) => ({ default: page.ScanDetailsPage })),
);

export const routes = [
  {
    path: '/',
    element: (
      <Suspense
        fallback={
          <main className="p-8" role="status">
            Loading AccessLens…
          </main>
        }
      >
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/app',
    element: (
      <Suspense
        fallback={
          <main className="page" role="status">
            Loading workspace…
          </main>
        }
      >
        <AppShell />
      </Suspense>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'new', element: <ScanPage /> },
      { path: 'findings', element: <FindingsPage /> },
      { path: 'scans/:scanId', element: <ScanDetailsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
      { path: 'guide', element: <GuidePage /> },
      {
        path: '*',
        element: (
          <div className="page">
            <h1>Page not found</h1>
            <p>This page does not exist.</p>
            <Link className="text-link" to="/app">
              Back to overview
            </Link>
          </div>
        ),
      },
    ],
  },
  ...['history', 'workspace', 'guide'].map((path) => ({
    path: `/${path}`,
    element: <Navigate to={`/app/${path}`} replace />,
  })),
  {
    path: '*',
    element: (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
        <Brand />
        <span className="font-mono text-sm text-muted-foreground">404 · PAGE NOT FOUND</span>
        <h1>This page took a different path.</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist. Let’s get you back to AccessLens.
        </p>
        <Button asChild>
          <Link to="/">Back to AccessLens</Link>
        </Button>
      </main>
    ),
  },
];

const router = createBrowserRouter(routes);
export function App() {
  return <RouterProvider router={router} />;
}
