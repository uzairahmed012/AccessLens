import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, BookOpen, Keyboard, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanUrlForm } from '@/features/scan/scan-url-form';
import { ScanHistory } from '@/features/scan/scan-history';

export function OverviewPage() {
  return (
    <div className="page overview-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR ACCESSIBILITY WORKSPACE</div>
          <h1>Overview</h1>
          <p>A place for clearer findings and more thoughtful fixes.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/app/guide">
            <BookOpen aria-hidden="true" /> Getting started
          </Link>
        </Button>
      </div>
      <ScanUrlForm />
      <div className="dashboard-columns">
        <Card className="history-card">
          <div className="card-header">
            <div>
              <h2>Recent scans</h2>
              <p>Pick up where you left off.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/history">
                View history <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ScanHistory recent />
        </Card>
        <Card className="getting-started-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">A GOOD PLACE TO START</span>
              <h2>Make room for everyone.</h2>
            </div>
          </div>
          <ol className="workspace-checklist">
            <li>
              <span>01</span>
              <div>
                <strong>Get to know your workspace</strong>
                <p>Explore the audit workflow and what’s taking shape.</p>
                <Link to="/app/guide">
                  View the roadmap <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Take a keyboard-only tour</strong>
                <p>Try Tab, Shift+Tab, and Enter on your own site. Can you reach every action?</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Start with the fundamentals</strong>
                <p>Build a shared understanding before your next audit.</p>
                <a
                  href="https://www.w3.org/WAI/test-evaluate/preliminary/"
                  target="_blank"
                  rel="noreferrer"
                >
                  W3C Easy Checks <ArrowUpRight size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          </ol>
        </Card>
      </div>
      <div className="manual-reminder">
        <span className="reminder-icon">
          <Keyboard size={21} aria-hidden="true" />
        </span>
        <div>
          <strong>Good checks start with people.</strong>
          <p>
            Automated findings are one part of the picture. Include keyboard, screen reader, and
            human review.
          </p>
        </div>
        <ShieldCheck size={27} className="reminder-end-icon" aria-hidden="true" />
      </div>
    </div>
  );
}
