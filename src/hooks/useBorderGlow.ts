import { useCallback, useRef, type PointerEvent } from 'react';

/**
 * Tracks pointer position relative to an element's center and exposes it as
 * two CSS custom properties (--edge-proximity, --cursor-angle) that
 * BorderGlow.css turns into a directional edge-lit glow. Written directly to
 * the DOM node (not React state) so the glow updates every pointermove
 * without triggering a re-render.
 */
export function useBorderGlow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

    let angle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    el.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
    el.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }, []);

  return { ref, onPointerMove };
}
