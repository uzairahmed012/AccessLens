import { useQuery } from '@tanstack/react-query';
import { Check, RefreshCw, TriangleAlert } from 'lucide-react';
import { fetchHealth } from '@/lib/api';
import { Button } from './ui/button';
import { Skeleton } from './ui/status';

export function ApiStatus() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  return (
    <div className="api-status" aria-live="polite">
      {query.isPending ? (
        <>
          <Skeleton className="status-skeleton" />
          Checking API…
        </>
      ) : query.isError ? (
        <>
          <TriangleAlert size={14} aria-hidden="true" />
          <span>API unavailable</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Retry API connection"
          >
            <RefreshCw size={13} aria-hidden="true" />
          </Button>
        </>
      ) : (
        <>
          <span className="status-ok">
            <Check size={10} aria-hidden="true" />
          </span>
          API online
        </>
      )}
    </div>
  );
}
