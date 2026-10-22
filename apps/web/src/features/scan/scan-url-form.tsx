import { ArrowRight, Globe2, LockKeyhole, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { createScan } from '@/lib/api';
import { createScanSchema } from '@accesslens/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ScanUrlForm() {
  const [url, setUrl] = useState('');
  const [validation, setValidation] = useState('');
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: createScan,
    retry: false,
    onSuccess: (scan) => {
      client.setQueryData(['scan', scan.id], scan);
      void client.invalidateQueries({ queryKey: ['scans'] });
      navigate(`/app/scans/${scan.id}`);
    },
  });
  const error = validation || mutation.error?.message;
  return (
    <section className="scan-panel" aria-labelledby="scan-heading">
      <div className="scan-panel-heading">
        <span className="scan-symbol">
          <ScanLine size={23} aria-hidden="true" />
        </span>
        <div>
          <h2 id="scan-heading">Scan a website</h2>
          <p>A clearer view of accessibility starts with a URL.</p>
        </div>
        <span className="preview-badge">Queue only</span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (mutation.isPending) return;
          const parsed = createScanSchema.safeParse({ url });
          if (!parsed.success) {
            setValidation('Enter a website URL of at most 2048 characters.');
            return;
          }
          setValidation('');
          mutation.mutate(parsed.data);
        }}
        aria-describedby="scan-unavailable"
        aria-busy={mutation.isPending}
      >
        <label htmlFor="website-url" className="field-label">
          Website URL
        </label>
        <div className="scan-input-row">
          <div className="url-input-wrap">
            <Globe2 size={19} aria-hidden="true" />
            <Input
              id="website-url"
              name="url"
              type="url"
              placeholder="https://your-website.com"
              required
              maxLength={2048}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setValidation('');
                mutation.reset();
              }}
              disabled={mutation.isPending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'scan-unavailable scan-error' : 'scan-unavailable'}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending || !url.trim()}>
            {mutation.isPending ? 'Saving job…' : 'Create scan job'}{' '}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <p id="scan-unavailable" className="scan-disabled-note">
          <LockKeyhole size={13} aria-hidden="true" />
          Approved public hosts only. Saves a queued job; no website is visited. Live scanning is
          not enabled.
        </p>
        {error && (
          <p id="scan-error" className="scan-form-error" role="alert">
            {error}
          </p>
        )}
        {mutation.isPending && (
          <p className="page-note" role="status">
            Validating the address and saving your queued job…
          </p>
        )}
      </form>
      <div className="scan-panel-footer">
        <span>
          <span className="small-square" /> Single-page audit
        </span>
        <span>
          <span className="small-square" /> WCAG-informed findings
        </span>
        <span>
          <span className="small-square" /> Actionable guidance
        </span>
        <span className="planned-label">Planned capabilities</span>
      </div>
    </section>
  );
}
