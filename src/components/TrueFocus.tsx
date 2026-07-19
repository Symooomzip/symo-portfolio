import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './TrueFocus.css';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
  /** applied to each word span — pass gradient/background-clip classes here,
   * not to className, since background-clip:text only clips an element's own
   * glyphs and the words live in child spans, not the container. */
  wordClassName?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type FocusStyles = CSSProperties & {
  '--focus-border-color': string;
  '--focus-glow-color': string;
  '--focus-duration': string;
};

const EMPTY_RECT: FocusRect = { x: 0, y: 0, width: 0, height: 0 };

// blurAmount is tuned against reactbits' fixed 3rem (48px) demo text. Our heading
// scales from 3rem to 10rem (see TrueFocus.css), so a flat px blur reads as
// near-invisible at large sizes. Converting to em keeps it proportional to the
// rendered font-size at any breakpoint.
const REFERENCE_FONT_SIZE_PX = 48;

export default function TrueFocus({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = 'green',
  glowColor = 'rgba(0, 255, 0, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = '',
  wordClassName = '',
}: TrueFocusProps) {
  const words = useMemo(() => sentence.split(separator), [sentence, separator]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState(0);
  const [focusRect, setFocusRect] = useState<FocusRect>(EMPTY_RECT);
  const containerRef = useRef<HTMLHeadingElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setCurrentIndex(index => Math.min(index, Math.max(words.length - 1, 0)));
  }, [words.length]);

  useEffect(() => {
    if (manualMode || prefersReducedMotion || words.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentIndex(index => (index + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => window.clearInterval(interval);
  }, [
    animationDuration,
    manualMode,
    pauseBetweenAnimations,
    prefersReducedMotion,
    words.length,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // reads the CURRENT active word via ref index each call, so a stale
    // closure can never point the frame at the wrong word.
    const updateFocusRect = () => {
      const activeWord = wordRefs.current[currentIndex];
      if (!activeWord) return;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeWord.getBoundingClientRect();

      setFocusRect({
        x: activeRect.left - containerRect.left,
        y: activeRect.top - containerRect.top,
        width: activeRect.width,
        height: activeRect.height,
      });
    };

    updateFocusRect();

    // Kanit can finish loading (and reflow the words) after this first
    // measurement — re-measure once it's actually ready so the frame doesn't
    // stay locked to a pre-webfont layout.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) updateFocusRect();
    });

    // observe every word, not just the active one, so a layout shift on any
    // word (including one not currently focused) is never missed.
    const resizeObserver = new ResizeObserver(updateFocusRect);
    resizeObserver.observe(container);
    wordRefs.current.forEach((el) => el && resizeObserver.observe(el));

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [currentIndex, words]);

  const focusStyles: FocusStyles = {
    '--focus-border-color': borderColor,
    '--focus-glow-color': glowColor,
    '--focus-duration': `${animationDuration}s`,
  };

  const handleMouseEnter = (index: number) => {
    if (!manualMode) return;

    setLastActiveIndex(currentIndex);
    setCurrentIndex(index);
  };

  const handleMouseLeave = () => {
    if (manualMode) setCurrentIndex(lastActiveIndex);
  };

  return (
    <h2
      ref={containerRef}
      className={`true-focus ${className}`.trim()}
      style={focusStyles}
      aria-label={sentence}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;

        return (
          <span
            key={`${word}-${index}`}
            ref={element => {
              wordRefs.current[index] = element;
            }}
            className={`true-focus__word${isActive ? ' true-focus__word--active' : ''} ${wordClassName}`.trim()}
            style={{
              filter: `blur(${isActive ? 0 : blurAmount / REFERENCE_FONT_SIZE_PX}em)`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
          >
            {word}
          </span>
        );
      })}

      <motion.span
        className="true-focus__frame"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: words.length > 0 ? 1 : 0,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : animationDuration,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      >
        <span className="true-focus__corner true-focus__corner--top-left" />
        <span className="true-focus__corner true-focus__corner--top-right" />
        <span className="true-focus__corner true-focus__corner--bottom-left" />
        <span className="true-focus__corner true-focus__corner--bottom-right" />
      </motion.span>
    </h2>
  );
}
