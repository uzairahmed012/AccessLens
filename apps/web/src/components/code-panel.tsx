import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useNotification } from './ui/notification';

export function CodePanel({
  label,
  code,
  improved = false,
  copy = false,
}: {
  label: string;
  code: string;
  improved?: boolean;
  copy?: boolean;
}) {
  const notify = useNotification();
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      notify('Example code copied. Review it before using.');
    } catch {
      notify('Couldn’t copy. Select the code manually.', true);
    }
  }
  return (
    <div className={`code-panel ${improved ? 'is-improved' : ''}`}>
      <div className="code-panel-label">
        <span>{label}</span>
        {copy && (
          <Tooltip content="Copy this illustrative code">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void copyCode()}
              aria-label="Copy example code"
            >
              <Copy aria-hidden="true" />
            </Button>
          </Tooltip>
        )}
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
