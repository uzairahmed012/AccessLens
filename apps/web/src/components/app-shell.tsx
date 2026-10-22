import { Suspense, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Layers3,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  ArrowLeft,
  FlaskConical,
  ScanLine,
  ListFilter,
  Menu,
} from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { ApiStatus } from './api-status';
import { Dialog } from './ui/dialog';
import { MotionPanel } from '@/lib/motion';
import { m } from 'motion/react';
import { useMotionTransition } from '@/lib/motion';

const navigation = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/new', label: 'New scan', icon: ScanLine },
  { to: '/app/history', label: 'Scan history', icon: Clock3 },
  { to: '/app/findings', label: 'Findings', icon: ListFilter },
  { to: '/app/workspace', label: 'Workspace', icon: Settings2 },
];

export function AppShell() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const { reduced, transition } = useMotionTransition();
  const title =
    navigation.find((item) => item.to === pathname)?.label ??
    (pathname === '/app/guide'
      ? 'Getting started'
      : pathname.startsWith('/app/scans/')
        ? 'Scan details'
        : 'Page not found');
  useEffect(() => {
    document.title = `${title} · AccessLens`;
    if (previousPath.current !== pathname || navigationType !== 'POP') {
      main.current?.focus();
      previousPath.current = pathname;
    }
  }, [pathname, title, navigationType]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Workspace sidebar">
        <Brand to="/app" label="AccessLens workspace" />
        <div className="mobile-workspace-menu">
          <Dialog
            title="Workspace navigation"
            description="Explore the local application preview."
            trigger={
              <Button size="icon" variant="outline" aria-label="Open workspace navigation">
                <Menu aria-hidden="true" />
              </Button>
            }
          >
            {(close) => (
              <nav className="dialog-navigation" aria-label="More workspace navigation">
                {navigation.map(({ to, label, icon: Icon }) => (
                  <Link to={to} key={to} onClick={close}>
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <Link to="/app/guide" onClick={close}>
                  <BookOpen size={18} aria-hidden="true" />
                  Getting started
                </Link>
              </nav>
            )}
          </Dialog>
        </div>
        <div className="workspace-switch">
          <span className="workspace-avatar">
            <Code2 size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>Personal workspace</strong>
            <span>Local preview</span>
          </div>
          <span className="workspace-key">PREVIEW</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation" className="main-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${to === '/app/findings' || to === '/app/workspace' ? 'secondary-nav-link' : ''}`
              }
            >
              <m.span
                className="nav-icon"
                whileHover={reduced ? undefined : { x: 2 }}
                transition={transition}
              >
                <Icon size={18} aria-hidden="true" />
              </m.span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <span className="nav-label">RESOURCES</span>
        <nav aria-label="Resources" className="main-nav">
          <NavLink
            to="/app/guide"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={18} aria-hidden="true" />
            Getting started
          </NavLink>
          <a
            className="nav-link"
            href="https://www.w3.org/WAI/WCAG22/quickref/"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={18} aria-hidden="true" />
            WCAG reference
            <ArrowUpRight size={14} className="nav-external" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="build-card">
            <span className="build-label">
              <Layers3 size={15} aria-hidden="true" /> A WORKSPACE TAKING SHAPE
            </span>
            <strong>
              Built for your next
              <br />
              accessibility breakthrough.
            </strong>
            <p>Explore the preview and see how the audit workflow is coming together.</p>
            <Link to="/app/guide">
              Explore the roadmap <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="sidebar-footer">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Built with accessibility in mind</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <Button asChild variant="ghost" size="sm" className="back-to-site">
              <Link to="/" aria-label="Back to public website">
                <ArrowLeft aria-hidden="true" /> <span>Website</span>
              </Link>
            </Button>
            <ApiStatus />
            <Dialog
              title="A foundation you can explore"
              description="AccessLens is in Phase 1. This is a local development preview, with no account required."
              trigger={
                <Button variant="ghost" size="icon" aria-label="About this preview">
                  <CircleHelp aria-hidden="true" />
                </Button>
              }
            >
              <ul className="dialog-list">
                <li>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <div>
                    <strong>Available now</strong>
                    <span>
                      Queued scan jobs, saved history, theme preferences, API health, and the
                      illustrative public inspector.
                    </span>
                  </div>
                </li>
                <li>
                  <ScanLine size={18} aria-hidden="true" />
                  <div>
                    <strong>Coming in future phases</strong>
                    <span>
                      Browser audits, stored findings, element inspection, fix guidance, and
                      authentication.
                    </span>
                  </div>
                </li>
              </ul>
            </Dialog>
            <span className="topbar-separator" />
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" ref={main} tabIndex={-1}>
          <div className="workspace-preview-banner">
            <FlaskConical size={16} aria-hidden="true" />
            <p>
              <strong>You’re exploring the workspace preview.</strong> Save queued jobs for approved
              hosts. Accounts and live scanning aren’t enabled yet.
            </p>
            <Link to="/app/guide">
              What’s next <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="page" role="status">
                Loading workspace…
              </div>
            }
          >
            <MotionPanel key={pathname}>
              <Outlet />
            </MotionPanel>
          </Suspense>
        </main>
        <footer className="main-footer">
          <span>
            AccessLens <span className="footer-version">Workspace preview</span>
          </span>
          <span>Scan. Understand. Fix.</span>
        </footer>
      </div>
    </div>
  );
}
