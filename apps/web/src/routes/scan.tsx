import { Link } from 'react-router';
import { Braces, Focus, ScanLine } from 'lucide-react';
import { ScanUrlForm } from '@/features/scan/scan-url-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Disclosure } from '@/components/disclosure';

export function ScanPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">START WITH A PAGE</div>
          <h1>New scan</h1>
          <p>A focused audit, with the evidence close at hand.</p>
        </div>
      </div>
      <ScanUrlForm />
      <div className="scan-preparation">
        <Card className="preparation-card">
          <h2>What your audit will include</h2>
          <ul className="dialog-list">
            <li>
              <ScanLine size={19} aria-hidden="true" />
              <div>
                <strong>Browser checks</strong>
                <span>Potential barriers in a rendered page.</span>
              </div>
            </li>
            <li>
              <Focus size={19} aria-hidden="true" />
              <div>
                <strong>Element context</strong>
                <span>A connection from the issue to the affected markup.</span>
              </div>
            </li>
            <li>
              <Braces size={19} aria-hidden="true" />
              <div>
                <strong>Fix guidance</strong>
                <span>Practical suggestions to review and test.</span>
              </div>
            </li>
          </ul>
          <p className="page-note">These capabilities are planned. Scanning is disabled.</p>
        </Card>
        <div>
          <Disclosure title="Which pages will I be able to test?">
            <p>
              The planned scanner will accept eligible public pages you have permission to audit.
              Network protections must be verified before it is enabled.
            </p>
          </Disclosure>
          <Disclosure title="Does an automated audit prove compliance?">
            <p>
              No. Automated checks cover only some accessibility barriers. Keyboard, screen reader,
              and human evaluation remain essential.
            </p>
          </Disclosure>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/app/guide">Read the development guide</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
