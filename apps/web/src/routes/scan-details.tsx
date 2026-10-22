import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status';
import { fetchScan, ApiError } from '@/lib/api';

export function ScanDetailsPage() {
  const { scanId = '' } = useParams();
  const query = useQuery({
    queryKey: ['scan', scanId],
    queryFn: ({ signal }) => fetchScan(scanId, signal),
    retry: false,
  });
  const scan = query.data;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SAVED SCAN JOB</div>
          <h1>Scan details</h1>
          <p>Job metadata and its current state.</p>
        </div>
        {scan && <StatusBadge>{scan.status}</StatusBadge>}
      </div>
      <Card className="scan-detail-card">
        {query.isPending && <p role="status">Loading scan job…</p>}
        {query.isError && (
          <div className="data-state">
            <h2>
              {query.error instanceof ApiError && query.error.code === 'NOT_FOUND'
                ? 'Scan job not found'
                : 'Could not load this scan job'}
            </h2>
            <p role="alert">{query.error.message}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry scan job
            </Button>
          </div>
        )}
        {scan && (
          <>
            <div role="status" className="job-status-message">
              {scan.status === 'queued'
                ? 'Queued — awaiting the scanning engine. No website has been visited and no findings have been generated.'
                : 'Live scanning is not enabled in this phase. No audit results are displayed here.'}
            </div>
            <dl className="scan-metadata">
              <div>
                <dt>Website</dt>
                <dd>{scan.normalizedUrl}</dd>
              </div>
              <div>
                <dt>Submitted URL</dt>
                <dd>{scan.url}</dd>
              </div>
              <div>
                <dt>Job ID</dt>
                <dd>
                  <code>{scan.id}</code>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>
                  <time dateTime={scan.createdAt}>{new Date(scan.createdAt).toLocaleString()}</time>
                </dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>
                  {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : 'Not started'}
                </dd>
              </div>
              <div>
                <dt>Finished</dt>
                <dd>
                  {scan.finishedAt ? new Date(scan.finishedAt).toLocaleString() : 'Not finished'}
                </dd>
              </div>
            </dl>
            {scan.errorSummary && <p role="alert">{scan.errorSummary}</p>}
          </>
        )}
        <div className="center-action">
          <Button asChild variant="outline">
            <Link to="/app/history">Back to scan history</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
