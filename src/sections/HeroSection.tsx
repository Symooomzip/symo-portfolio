import FadeIn from '../components/FadeIn';
import Magnet from '../components/Magnet';
import ContactButton from '../components/ContactButton';
import NeuralCanvas from '../components/NeuralCanvas';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export default function HeroSection() {
  return (
    <section className="relative flex h-screen flex-col" style={{ overflowX: 'clip' }}>
      {/* neural network background */}
      <NeuralCanvas className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* navbar */}
      <FadeIn delay={0} y={-20}>
        <nav className="relative z-20 flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="cursor-target text-sm font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 md:text-lg lg:text-[1.4rem]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </FadeIn>

      {/* giant heading */}
      <div className="relative z-10 overflow-hidden">
        <FadeIn delay={0.15} y={40}>
          <h1 className="hero-heading mt-6 w-full whitespace-nowrap text-center text-[12.5vw] font-black uppercase leading-none tracking-tight sm:mt-4 sm:text-[13.5vw] md:-mt-5 md:text-[14.5vw] lg:text-[15.5vw]">
            Hi, i&apos;m fakir
          </h1>
        </FadeIn>
      </div>

      {/* 3D avatar with magenta halo */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 sm:top-auto sm:bottom-0 sm:translate-y-0">
        <FadeIn delay={0.6} y={30}>
        <Magnet padding={150} strength={3}>
          <div className="relative w-[240px] sm:w-[300px] md:w-[360px] lg:w-[420px]">
            {/* glowing halo behind the head */}
            <div
              className="orb-pulse absolute left-1/2 top-[45%] h-[70%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(182,0,168,0.45) 0%, rgba(118,33,176,0.3) 45%, transparent 72%)',
                filter: 'blur(28px)',
              }}
            />
            <img
              src="/head.png"
              alt="Mohammed Fakir — 3D avatar"
              className="relative w-full"
              style={{
                WebkitMaskImage:
                  'radial-gradient(50% 50% at 50% 50%, black 78%, transparent 100%)',
                maskImage:
                  'radial-gradient(50% 50% at 50% 50%, black 78%, transparent 100%)',
              }}
            />
          </div>
        </Magnet>
        </FadeIn>
      </div>

      {/* bottom bar */}
      <div className="relative z-10 mt-auto flex items-end justify-between px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn delay={0.35} y={20}>
          <p
            className="max-w-[160px] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[220px] md:max-w-[260px]"
            style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)' }}
          >
            a data scientist &amp; full stack developer crafting intelligent, unforgettable products
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}
