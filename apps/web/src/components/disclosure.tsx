import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { MotionPanel } from '@/lib/motion';

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="ui-disclosure">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {title}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open}>
        {open && <MotionPanel>{children}</MotionPanel>}
      </div>
    </div>
  );
}
