import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  children,
  headingLevel = 3,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={23} aria-hidden="true" />
      </div>
      <Heading>{title}</Heading>
      <p>{children}</p>
    </div>
  );
}
