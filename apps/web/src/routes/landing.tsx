import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router';
import { m, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  ChevronRight,
  Code2,
  FileText,
  Focus,
  GitCompareArrows,
  Keyboard,
  Menu,
  ScanLine,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProductPreview } from '@/components/marketing/product-preview';
import { Reveal, motionTokens, useMotionTransition } from '@/lib/motion';
import '@/styles/marketing.css';
import '@/styles/product-preview.css';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#accessibility', label: 'Accessibility standards' },
];
const features = [
  {
    icon: ScanLine,
    title: 'Check the rendered page.',
    text: 'Browser-powered audits will examine the page people actually interact with, beyond its source code.',
    label: 'Browser-powered scanning',
  },
  {
    icon: ShieldCheck,
    title: 'Put each rule in context.',
    text: 'Connect potential barriers to WCAG criteria so your team can understand the reasoning behind a check.',
    label: 'WCAG-informed detection',
  },
  {
    icon: Focus,
    title: 'Go straight to the element.',
    text: 'Visual highlighting will connect a finding to its location on the page. Keep the evidence in view.',
    label: 'Visual element inspection',
  },
  {
    icon: Braces,
    title: 'Turn a finding into a fix.',
    text: 'Practical code examples will explain a possible direction. Review every suggestion in your own context.',
    label: 'Actionable fix suggestions',
  },
  {
    icon: GitCompareArrows,
    title: 'See what changed.',
    text: 'Revisit earlier audits and compare results after a change, without losing the original context.',
    label: 'Scan history & comparisons',
  },
  {
    icon: FileText,
    title: 'Keep the useful details.',
    text: 'Focused reports will bring rules, affected elements, and guidance together for development and review.',
    label: 'Developer-friendly reports',
  },
];
const steps = [
  ['Choose a page.', 'Enter the URL of a public website you have permission to test.'],
  [
    'Run an audit.',
    'Browser checks will look for automatically detectable accessibility barriers.',
  ],
  [
    'Review the evidence.',
    'Inspect findings, highlighted elements, and the reasoning behind each check.',
  ],
  [
    'Fix. Review. Repeat.',
    'Apply a considered change, test it manually, and audit the page again.',
  ],
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const navigationType = useNavigationType();
  const { reduced, transition } = useMotionTransition(motionTokens.section);
  useEffect(() => {
    document.title = 'AccessLens — Find accessibility issues. Fix with confidence.';
  }, []);
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      target?.scrollIntoView();
      target?.focus({ preventScroll: true });
    } else if (navigationType !== 'POP') main.current?.focus();
  }, [hash, navigationType]);
  useEffect(() => {
    if (!menuOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);
  return (
    <div className="marketing-site">
      <a className="skip-link" href="#public-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <div className="marketing-nav-wrap marketing-container">
          <Brand />
          <nav aria-label="Public navigation" className="marketing-desktop-nav">
            {links.map(({ href, label }) => (
              <m.a
                key={href}
                href={href}
                whileHover={reduced ? undefined : { y: -1 }}
                transition={transition}
              >
                {label}
              </m.a>
            ))}
            <Link to="/app/guide">Documentation</Link>
          </nav>
          <div className="marketing-nav-actions">
            <ThemeToggle />
            <Button asChild className="nav-cta">
              <Link to="/app">
                Open app <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            <button
              ref={menuButton}
              className="mobile-menu-button icon-control"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="public-mobile-nav"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X size={21} aria-hidden="true" />
              ) : (
                <Menu size={21} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <m.nav
              id="public-mobile-nav"
              aria-label="Mobile public navigation"
              className="marketing-mobile-nav"
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              {links.map(({ href, label }) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                  {label}
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              ))}
              <Link to="/app/guide">
                Documentation <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/app">
                Open workspace <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </m.nav>
          )}
        </AnimatePresence>
      </header>
      <main id="public-content" ref={main} tabIndex={-1}>
        <section className="marketing-hero marketing-container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <Reveal>
              <a href="#product" className="hero-announcement">
                <span className="signal-dot" /> A clearer view of accessibility{' '}
                <ChevronRight size={15} aria-hidden="true" />
              </a>
            </Reveal>
            <h1 id="hero-title">
              <Reveal as="span" delay={0.04}>
                Find accessibility <br className="hero-copy-break" />
                issues.
              </Reveal>{' '}
              <Reveal as="span" delay={0.08}>
                <span>
                  Fix them with
                  <br className="hero-desktop-break" /> confidence.
                </span>
              </Reveal>
            </h1>
            <Reveal delay={0.12}>
              <p>
                Understand the barrier. Find the element. Make a better fix. AccessLens is the
                accessibility workspace being built for developers, QA teams, and agencies.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="hero-actions">
                <m.div
                  whileHover={reduced ? undefined : { y: -2 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  transition={transition}
                >
                  <Button asChild className="marketing-primary">
                    <Link to="/app">
                      Explore the workspace <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </m.div>
                <a className="marketing-text-link" href="#how-it-works">
                  See how it works <ChevronRight size={16} aria-hidden="true" />
                </a>
              </div>
              <p className="hero-availability">
                Development preview · Live scanning is coming later.
              </p>
            </Reveal>
          </div>
          <Reveal className="hero-preview" delay={0.12}>
            <ProductPreview />
          </Reveal>
        </section>
        <div className="audience-strip marketing-container">
          <span>FOR THE PEOPLE WHO SHIP THE WEB</span>
          <div>
            <Code2 size={18} aria-hidden="true" /> Developers
          </div>
          <div>
            <Keyboard size={18} aria-hidden="true" /> QA & engineering
          </div>
          <div>
            <Users size={18} aria-hidden="true" /> Studios & agencies
          </div>
        </div>
        <section
          id="features"
          className="marketing-section marketing-container"
          aria-labelledby="features-title"
          tabIndex={-1}
        >
          <Reveal>
            <div className="marketing-section-heading">
              <div>
                <span className="marketing-eyebrow">FROM EVIDENCE TO ACTION</span>
                <h2 id="features-title">
                  An issue is only useful
                  <br />
                  if you know what’s next.
                </h2>
              </div>
              <p>
                The workflow we’re building brings findings, context, and practical guidance into
                one place. All six capabilities below are planned.
              </p>
            </div>
          </Reveal>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text, label }, index) => (
              <Reveal key={title} delay={(index % 3) * 0.04}>
                <article className="feature-item">
                  <div className="feature-item-top">
                    <Icon size={23} aria-hidden="true" />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="feature-label">{label}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section
          id="how-it-works"
          className="workflow-section"
          aria-labelledby="workflow-title"
          tabIndex={-1}
        >
          <div className="marketing-container">
            <Reveal>
              <div className="marketing-section-heading">
                <div>
                  <span className="marketing-eyebrow">A FOCUSED AUDIT LOOP</span>
                  <h2 id="workflow-title">From a URL to a way forward.</h2>
                </div>
                <p>
                  Four steps, with the context kept close.
                  <br />
                  This workflow will be available in a future phase.
                </p>
              </div>
            </Reveal>
            <ol className="marketing-steps">
              {steps.map(([title, text], index) => (
                <li key={title}>
                  <Reveal delay={index * 0.04}>
                    <span className="step-number">0{index + 1}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
            <p className="workflow-note">
              <ScanLine size={17} aria-hidden="true" /> Available today: explore the workspace, try
              the illustrative inspector, and read the development guide.
            </p>
          </div>
        </section>
        <section
          id="accessibility"
          className="accessibility-section marketing-container"
          aria-labelledby="accessibility-title"
          tabIndex={-1}
        >
          <Reveal className="accessibility-copy">
            <span className="marketing-eyebrow">BEHIND EVERY CHECK, A PERSON</span>
            <h2 id="accessibility-title">
              Better access.
              <br />
              <span>Better experiences.</span>
            </h2>
            <p>
              A missing label can hide an action. A keyboard trap can stop a journey. Accessibility
              work helps more people use what you build.
            </p>
            <a
              className="marketing-text-link"
              href="https://www.w3.org/WAI/standards-guidelines/wcag/"
              target="_blank"
              rel="noreferrer"
            >
              Get to know WCAG <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Reveal>
          <Reveal className="accessibility-values">
            <article>
              <ShieldCheck size={22} aria-hidden="true" />
              <div>
                <h3>A shared standard.</h3>
                <p>
                  WCAG gives teams a common reference for discussing accessibility barriers and
                  evaluating changes.
                </p>
              </div>
            </article>
            <article>
              <Focus size={22} aria-hidden="true" />
              <div>
                <h3>Automation finds part of the picture.</h3>
                <p>
                  Automated checks can identify certain issues, such as missing accessible names.
                  They cannot judge every experience or guarantee WCAG compliance.
                </p>
              </div>
            </article>
            <article>
              <Keyboard size={22} aria-hidden="true" />
              <div>
                <h3>Human testing stays essential.</h3>
                <p>
                  Include keyboard navigation, screen reader testing, and people with disabilities
                  in your review. A scan is a starting point, not a certification.
                </p>
              </div>
            </article>
          </Reveal>
        </section>
        <section className="final-cta-section marketing-container" aria-labelledby="cta-title">
          <Reveal>
            <div>
              <span className="marketing-eyebrow">BUILD WITH MORE PEOPLE IN MIND</span>
              <h2 id="cta-title">
                Your next step toward
                <br />a more accessible web.
              </h2>
              <p>Take a look inside. See where AccessLens is heading.</p>
            </div>
            <m.div whileHover={reduced ? undefined : { y: -2 }} transition={transition}>
              <Button asChild className="marketing-primary">
                <Link to="/app">
                  Explore AccessLens <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <span className="cta-note">Local preview. No account required.</span>
            </m.div>
          </Reveal>
        </section>
      </main>
      <footer className="marketing-footer">
        <div className="marketing-container">
          <div className="marketing-footer-top">
            <div>
              <Brand />
              <p>A clearer view. A more inclusive web.</p>
            </div>
            <nav aria-label="Footer navigation">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <Link to="/app/guide">Documentation</Link>
              <Link to="/app">
                Workspace <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </nav>
          </div>
          <div className="marketing-footer-bottom">
            <span>© 2026 AccessLens</span>
            <span>Scan. Understand. Fix.</span>
            <a href="https://www.w3.org/WAI/" target="_blank" rel="noreferrer">
              Web accessibility resources <ArrowUpRight size={13} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
