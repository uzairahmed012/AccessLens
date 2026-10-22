import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export const motionTokens = {
  feedback: 0.12,
  content: 0.16,
  dialog: 0.18,
  exit: 0.12,
  section: 0.22,
  stagger: 0.04,
  ease: [0.22, 1, 0.36, 1] as const,
};
export function useMotionTransition(duration = motionTokens.content) {
  const reduced = useReducedMotion();
  return { reduced, transition: { duration: reduced ? 0 : duration, ease: motionTokens.ease } };
}
export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'span';
}) {
  const { reduced, transition } = useMotionTransition(motionTokens.section);
  const Element = as === 'span' ? m.span : m.div;
  return (
    <Element
      className={className}
      initial={reduced ? false : { y: 10 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ ...transition, delay: reduced ? 0 : delay }}
    >
      {children}
    </Element>
  );
}
export function MotionPanel({ children, className }: { children: ReactNode; className?: string }) {
  const { reduced, transition } = useMotionTransition();
  return (
    <m.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {children}
    </m.div>
  );
}
