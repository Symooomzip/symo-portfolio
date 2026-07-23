import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
          onDragEnd={(_, info) => {
            if (info.offset.x < -70 || info.velocity.x < -450) paginate(1);
            else if (info.offset.x > 70 || info.velocity.x > 450) paginate(-1);
          }}
          className="absolute inset-0 h-full w-full cursor-grab object-cover object-top active:cursor-grabbing"
          draggable={false}
        />
      </AnimatePresence>

      {/* top gradient keeps the tag readable over bright captures */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0b0d10]/70 to-transparent" />

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
    </div>
  );
}
