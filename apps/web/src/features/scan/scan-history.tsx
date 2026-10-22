import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { FileSearch } from 'lucide-react';
import { fetchScans } from '@/lib/api';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status';
import { EmptyState } from '@/components/empty-state';

export function ScanHistory({ recent = false }: { recent?: boolean }) {
  const query = useInfiniteQuery({
    queryKey: ['scans'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => fetchScans(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const all = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = recent ? all.slice(0, 5) : all;
  if (query.isPending)
    return (
      <div className="data-state" role="status">
        Loading scan history…
      </div>
    );
  if (query.isError && !query.data)
    return (
      <div className="data-state">
        <p role="alert">{query.error.message}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry scan history
        </Button>
      </div>
    );
  if (!items.length)
    return (
      <>
        <EmptyState headingLevel={recent ? 3 : 2} icon={FileSearch} title="No scan history yet">
          Create your first queued job for an approved public website. Live scanning will arrive in
          a later phase.
        </EmptyState>
        <div className="center-action">
          <Button asChild variant="outline">
            <Link to="/app/new">Create a scan job</Link>
          </Button>
        </div>
      </>
    );
  return (
    <>
      <Table caption="Scan history records" columns={['Website', 'Status', 'Created']}>
        {items.map((scan) => (
          <tr key={scan.id}>
            <td className="scan-url-cell">
              <Link to={`/app/scans/${scan.id}`}>{scan.normalizedUrl}</Link>
            </td>
            <td>
              <StatusBadge>{scan.status}</StatusBadge>
            </td>
            <td>
              <time dateTime={scan.createdAt}>{new Date(scan.createdAt).toLocaleString()}</time>
            </td>
          </tr>
        ))}
      </Table>
      {!recent && (
        <div className="center-action">
          {query.hasNextPage && (
            <Button
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Loading more…' : 'Load more scan jobs'}
            </Button>
          )}
          {query.isFetchNextPageError && (
            <p role="alert">Could not load the next page. Please retry.</p>
          )}
          <span className="sr-only" role="status">
            {items.length} scan jobs loaded.
          </span>
        </div>
      )}
    </>
  );
}
