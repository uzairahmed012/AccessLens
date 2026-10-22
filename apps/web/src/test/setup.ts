import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { beforeEach, afterEach, vi } from 'vitest';

// Lazy route imports may take over a second on this native Windows workspace.
configure({ asyncUtilTimeout: 5_000 });

// Node 25 exposes a native localStorage stub; bind tests to actual jsdom storage.
beforeEach(() => {
  vi.stubGlobal('localStorage', window.localStorage);
  // jsdom has no layout/IntersectionObserver; real viewport behavior is covered in Chrome.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
