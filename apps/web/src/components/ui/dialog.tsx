import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, m } from 'motion/react';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motionTokens, useMotionTransition } from '@/lib/motion';

export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const restoreFocus = useRef(true);
  // The render prop wires this event callback to navigation links. Their new route owns focus.
  const closeForNavigation = useCallback(() => {
    restoreFocus.current = false;
    setOpen(false);
  }, []);
  const { reduced, transition } = useMotionTransition(motionTokens.dialog);
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (value) restoreFocus.current = true;
        setOpen(value);
      }}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <DialogPrimitive.Overlay forceMount asChild>
                <m.div
                  className="dialog-overlay"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { ...transition, duration: reduced ? 0 : motionTokens.exit },
                  }}
                  transition={transition}
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content
                forceMount
                asChild
                onCloseAutoFocus={(event) => {
                  if (!restoreFocus.current) event.preventDefault();
                }}
              >
                <m.section
                  className="dialog-content"
                  initial={
                    reduced ? { x: '-50%', y: '-50%' } : { x: '-50%', y: '-48%', opacity: 0 }
                  }
                  animate={{ x: '-50%', y: '-50%', opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { ...transition, duration: reduced ? 0 : motionTokens.exit },
                  }}
                  transition={transition}
                >
                  <div className="dialog-heading">
                    <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                    <DialogPrimitive.Close className="icon-control" aria-label="Close dialog">
                      <X size={19} aria-hidden="true" />
                    </DialogPrimitive.Close>
                  </div>
                  <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
                  {/* The owned render prop only attaches this callback to navigation events. */}
                  {/* eslint-disable-next-line react-hooks/refs */}
                  {typeof children === 'function' ? children(closeForNavigation) : children}
                </m.section>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
