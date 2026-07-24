import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TargetCursor from './components/TargetCursor';
import ChatWidget from './components/ChatWidget';
import CanvasErrorBoundary from './components/CanvasErrorBoundary';
import HeroSection from './sections/HeroSection';
import MarqueeSection from './sections/MarqueeSection';
import AboutSection from './sections/AboutSection';
import ExpertiseSection from './sections/ExpertiseSection';
import ProjectsSection from './sections/ProjectsSection';
import ContactSection from './sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

if (import.meta.env.DEV) {
  (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // re-measure after late layout shifts (web fonts, images) so triggers don't go stale
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    const settle = window.setTimeout(refresh, 1200);

    // guarantee trigger updates even when scrolling happens outside Lenis (keyboard, programmatic)
    const onNativeScroll = () => ScrollTrigger.update();
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('load', refresh);
      window.removeEventListener('scroll', onNativeScroll);
      window.clearTimeout(settle);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative bg-[#121414]" style={{ overflowX: 'clip' }}>
      <TargetCursor parallaxOn cornerColor="#B600A8" />
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ExpertiseSection />
      <ProjectsSection />
      <ContactSection />
      {/* sibling, never a wrapper — TargetCursor walks ancestors for its containing block */}
      <CanvasErrorBoundary label="ChatWidget">
        <ChatWidget />
      </CanvasErrorBoundary>
    </div>
  );
}
