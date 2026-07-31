import { useEffect, useState } from 'react';

/**
 * Tracks the app's manual `.dark` class toggle on <html> (App.tsx owns the
 * state; this lets components outside that prop chain — like modals — react
 * to it without threading isDark through every intermediate component).
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(target.classList.contains('dark'));
    });
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
