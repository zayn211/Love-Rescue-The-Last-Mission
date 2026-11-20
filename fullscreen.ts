import { useEffect, useState } from 'react';

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

type FullscreenEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function isFullscreenActive(): boolean {
  const doc = document as FullscreenDoc;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export function isFullscreenSupported(): boolean {
  const doc = document as FullscreenDoc;
  const el = document.documentElement as FullscreenEl;
  return Boolean(
    doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      el.requestFullscreen ||
      el.webkitRequestFullscreen
  );
}

export async function tryLockLandscape(): Promise<void> {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape' | 'portrait') => Promise<void>;
    };
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
    }
  } catch {
    // Orientation lock is optional and unsupported on desktop or non-fullscreen iOS/Android webviews
  }
}

export async function enterFullscreenAndLandscape(): Promise<boolean> {
  const el = document.documentElement as FullscreenEl;
  let entered = isFullscreenActive();
  if (!entered) {
    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        entered = true;
      } else if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen();
        entered = true;
      }
    } catch {
      entered = false;
    }
  }
  await tryLockLandscape();
  return entered;
}

export async function toggleFullscreen(): Promise<boolean> {
  const doc = document as FullscreenDoc;
  if (isFullscreenActive()) {
    try {
      if (typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore exit errors
    }
    return false;
  }
  return enterFullscreenAndLandscape();
}

export function useFullscreenState() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? isFullscreenActive() : false
  );
  const [supported] = useState<boolean>(() =>
    typeof document !== 'undefined' ? isFullscreenSupported() : false
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  return {
    isFullscreen,
    supported,
    toggle: () => {
      void toggleFullscreen();
    },
  };
}
