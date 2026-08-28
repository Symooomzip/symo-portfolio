import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import type { Shot } from './ScreenshotCarousel';

/* ----------------------------------------------------------------------------
   Full-screen viewer for the project captures.

   The dashboards are ~1600px wide with real text in them; inside a card they
   are a 5x downscale and unreadable. "Fit" shows the whole frame, "actual
   size" renders the image at its natural width inside a scroll container so
   the browser handles pan and pinch natively — which behaves far better on
   iOS than a hand-rolled transform-based zoom.

   Sits above the chat widget (9020) but below TargetCursor (9999) so the
   bracket cursor still draws over it.
---------------------------------------------------------------------------- */

interface LightboxProps {
  shots: Shot[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export default function Lightbox({ shots, index, onNavigate, onClose }: LightboxProps) {
  const reduceMotion = useReducedMotion();
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shot = shots[index];

  const go = useCallback(
    (step: number) => {
      setZoomed(false);
      onNavigate((index + step + shots.length) % shots.length);
    },
    [index, shots.length, onNavigate],
  );

  // Locking scroll must run once for the lifetime of the overlay. Kept apart
  // from the key handler below, whose deps change on every parent render —
  // sharing one effect would re-capture `prev` as 'hidden' and leave the page
  // permanently unscrollable after closing.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ') {
        e.preventDefault();
        setZoomed((z) => !z);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  // center the frame horizontally when entering actual-size mode
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !zoomed) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [zoomed, index]);

  // GSAP scales .project-card, which makes it the containing block for any
  // position:fixed descendant — rendered in place the overlay would be sized
  // to the card and clipped by its overflow-hidden. Portal to body instead.
  return createPortal(
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      className="fixed inset-0 z-[9500] flex flex-col bg-[#0b0d10]/97 backdrop-blur-md"
    >
      {/* header */}
      <div className="flex flex-none items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[.2em] text-[#D7E2EA]/45">
            {index + 1} / {shots.length}
          </div>
          <div className="truncate text-[12px] text-[#D7E2EA]/70 sm:text-[13px]">{shot.alt}</div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Fit to screen' : 'View actual size'}
            className="cursor-target rounded-lg border border-[#D7E2EA]/20 p-2 text-[#D7E2EA]/70 transition-colors hover:border-[#B600A8]/50 hover:text-[#D7E2EA]"
          >
            {zoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="cursor-target rounded-lg border border-[#D7E2EA]/20 p-2 text-[#D7E2EA]/70 transition-colors hover:border-[#B600A8]/50 hover:text-[#D7E2EA]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* image stage */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className={`relative flex-1 overscroll-contain ${
          zoomed ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden px-3 sm:px-14'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={shot.src}
            src={shot.src}
            alt={shot.alt}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setZoomed((z) => !z)}
            draggable={false}
            className={
              zoomed
                ? 'max-w-none cursor-zoom-out'
                : 'max-h-full max-w-full cursor-zoom-in rounded-lg object-contain'
            }
          />
        </AnimatePresence>
      </div>

      {/* controls */}
      {shots.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous screenshot"
            className="cursor-target absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#D7E2EA]/20 bg-[#0b0d10]/70 text-[#D7E2EA] backdrop-blur-sm transition-colors hover:bg-[#0b0d10] sm:left-4"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next screenshot"
            className="cursor-target absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#D7E2EA]/20 bg-[#0b0d10]/70 text-[#D7E2EA] backdrop-blur-sm transition-colors hover:bg-[#0b0d10] sm:right-4"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex flex-none items-center justify-center gap-2 py-4">
            {shots.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Go to screenshot ${i + 1}`}
                onClick={() => {
                  setZoomed(false);
                  onNavigate(i);
                }}
                className="cursor-target h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 22 : 6,
                  background: i === index ? '#B600A8' : 'rgba(215,226,234,.3)',
                }}
              />
            ))}
          </div>
        </>
      )}

      <div className="pb-3 text-center font-mono text-[9px] tracking-[.2em] text-[#D7E2EA]/30">
        {zoomed ? 'DRAG TO PAN · TAP TO FIT' : 'TAP IMAGE TO ZOOM · ESC TO CLOSE'}
      </div>
    </motion.div>,
    document.body,
  );
}
