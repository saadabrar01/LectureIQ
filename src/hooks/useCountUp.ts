import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  duration?: number;
}

/**
 * Count-up animation for stat values. Handles both plain integers
 * ("327") and suffixed values ("14d") by counting the leading number
 * and re-appending the suffix. Uses a plain-state rAF loop so it works
 * identically on native and web.
 */
export function useCountUp(target: string, { duration = 700 }: UseCountUpOptions = {}) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const suffix = target.match(/([^\d]*)$/)?.[0] ?? '';
    const numericStr = target.replace(suffix, '');
    const end = Number(numericStr);
    if (!Number.isFinite(end)) {
      setDisplay(target);
      return;
    }

    // Short animation to reach the integer part, suffix re-added.
    const start = 0;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const val = Math.round(start + (end - start) * eased);
      setDisplay(`${val}${suffix}`);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}
