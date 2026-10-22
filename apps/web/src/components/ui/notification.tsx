import { createContext, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useMotionTransition } from '@/lib/motion';

const NotificationContext = createContext<(message: string, error?: boolean) => void>(() => {});
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ id: number; message: string; error: boolean } | null>(
    null,
  );
  const { reduced, transition } = useMotionTransition();
  return (
    <NotificationContext.Provider
      value={(message, error = false) => setNotice({ id: Date.now(), message, error })}
    >
      {children}
      <div className="notification-region" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {notice && (
            <m.div
              key={notice.id}
              className="ui-notification"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              {notice.error ? (
                <TriangleAlert size={19} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={19} aria-hidden="true" />
              )}
              <span>{notice.message}</span>
              <button
                className="icon-control"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notification"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
export function useNotification() {
  return useContext(NotificationContext);
}
