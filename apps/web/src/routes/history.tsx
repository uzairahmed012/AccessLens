import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScanHistory } from '@/features/scan/scan-history';

export function HistoryPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR AUDIT TRAIL</div>
          <h1>Scan history</h1>
          <p>Your saved jobs, newest first.</p>
        </div>
      </div>
      <Card className="history-page-card">
        <ScanHistory />
      </Card>
      <p className="page-note">
        <Info size={16} aria-hidden="true" />
        Queued jobs are waiting for the future scanning engine. They have no audit results yet.
      </p>
    </div>
  );
}
