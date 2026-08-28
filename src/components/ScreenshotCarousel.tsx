import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import Lightbox from './Lightbox';

export interface Shot {
  src: string;
  alt: string;
}

interface ScreenshotCarouselProps {
  shots: Shot[];
  accent: string;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function ScreenshotCarousel({ shots, accent }: ScreenshotCarouselProps) {
  // [index, direction] — direction drives the slide animation
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const [expanded, setExpanded] = useState(false);
  // a swipe ends with a click event on the image; this keeps it from also
  // opening the viewer
  const draggingRef = useRef(false);

  const paginate = (step: number) => {
    const next = (index + step + shots.length) % shots.length;
    setState([next, step]);
  };
  const goTo = (target: number) => {
    if (target === index) return;
    setState([target, target > index ? 1 : -1]);
  };

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.img
          key={index}
          src={shots[index].src}
          alt={shots[index].alt}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 300, damping: 34 }, opacity: { duration: 0.25 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragStart={() => {
            draggingRef.current = true;
          }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70 || info.velocity.x < -450) paginate(1);
            else if (info.offset.x > 70 || info.velocity.x > 450) paginate(-1);
            // the click lands right after dragEnd, so clear on the next tick
            setTimeout(() => {
              draggingRef.current = false;
            }, 0);
          }}
          onClick={() => {
            if (!draggingRef.current) setExpanded(true);
          }}
          className="absolute inset-0 h-full w-full cursor-zoom-in object-contain active:cursor-grabbing"
          draggable={false}
        />
      </AnimatePresence>

      {/* top gradient keeps the tag readable over bright captures */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0b0d10]/70 to-transparent" />

      {/* the dashboards are unreadable at card size — say so, or nobody taps */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="View screenshot full screen"
        className="cursor-target absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#D7E2EA]/20 bg-[#0b0d10]/70 px-2.5 py-1.5 font-mono text-[9px] tracking-[.18em] text-[#D7E2EA]/70 backdrop-blur-sm transition-colors hover:border-[#B600A8]/50 hover:text-[#D7E2EA]"
      >
        <Expand size={11} />
        ZOOM
      </button>

      {/* arrows */}
      <button
        type="button"
        aria-label="Previous screenshot"
        onClick={() => paginate(-1)}
        className="cursor-target absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#D7E2EA]/20 bg-[#0b0d10]/60 text-[#D7E2EA] backdrop-blur-sm transition-colors hover:bg-[#0b0d10]/85"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        aria-label="Next screenshot"
        onClick={() => paginate(1)}
        className="cursor-target absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#D7E2EA]/20 bg-[#0b0d10]/60 text-[#D7E2EA] backdrop-blur-sm transition-colors hover:bg-[#0b0d10]/85"
      >
        <ChevronRight size={17} />
      </button>

      {/* dots */}
      <div className="absolute inset-x-0 bottom-3.5 z-10 flex items-center justify-center gap-2">
        {shots.map((shot, i) => (
          <button
            key={shot.src}
            type="button"
            aria-label={`Go to screenshot ${i + 1}`}
            onClick={() => goTo(i)}
            className="cursor-target h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              background: i === index ? accent : 'rgba(215,226,234,.3)',
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <Lightbox
            shots={shots}
            index={index}
            onNavigate={goTo}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
