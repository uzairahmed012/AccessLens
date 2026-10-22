import { ArrowUpRight, Check, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const phases = [
  [
    '00',
    'A solid foundation',
    'The app shell, design system, live API health, and development tooling.',
  ],
  [
    '01',
    'Persisted scans & safe intake',
    'Neon storage, validated requests, and a trusted host allowlist.',
  ],
  [
    '02',
    'Real browser scanning',
    'A separate Playwright worker with axe and verified network restrictions.',
  ],
  [
    '03–06',
    'Understand, locate & improve',
    'Results, screenshot highlighting, remediation guidance, history and comparison.',
  ],
  [
    '07',
    'Harden & launch',
    'Security review, ownership, retention, observability, and accessibility QA.',
  ],
];

export function GuidePage() {
  return (
    <div className="page guide-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE ROAD AHEAD</div>
          <h1>Better access, step by step.</h1>
          <p>AccessLens is being built in deliberate, verifiable phases.</p>
        </div>
      </div>
      <Card className="roadmap-card">
        {phases.map(([number, title, description], index) => (
          <div className="roadmap-row" key={number}>
            <span className={`roadmap-marker ${index === 0 ? 'current' : ''}`}>
              {index === 0 ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Circle size={12} aria-hidden="true" />
              )}
            </span>
            <div>
              <span className="roadmap-phase">
                PHASE {number}
                {index === 0 && ' · FOUNDATION'}
                {index === 1 && ' · CURRENT IMPLEMENTATION'}
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </Card>
      <div className="guide-reference">
        <h2>Start with the people using your website.</h2>
        <p>
          Automated findings will help identify some barriers. Combine them with manual checks and
          feedback from people with disabilities.
        </p>
        <a
          className="text-link"
          href="https://www.w3.org/WAI/fundamentals/accessibility-intro/"
          target="_blank"
          rel="noreferrer"
        >
          Introduction to web accessibility <ArrowUpRight size={15} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
