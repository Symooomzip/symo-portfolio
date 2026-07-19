import { Download, Github, Linkedin, Mail } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import TrueFocus from '../components/TrueFocus';

const LINKS = [
  {
    label: 'mr.fakir.mohammed@gmail.com',
    href: 'mailto:mr.fakir.mohammed@gmail.com',
    Icon: Mail,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/mohammed-fakir',
    Icon: Linkedin,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Symooomzip',
    Icon: Github,
  },
];

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-5 py-24 sm:gap-12 sm:px-8 md:px-10"
    >
      <FadeIn y={40}>
        <TrueFocus
          sentence="Let's talk"
          manualMode={false}
          blurAmount={5}
          borderColor="#B600A8"
          glowColor="rgba(182, 0, 168, 0.6)"
          animationDuration={0.5}
          pauseBetweenAnimations={1}
          className="text-center font-black uppercase leading-none tracking-tight"
          wordClassName="hero-heading"
        />
      </FadeIn>

      <FadeIn delay={0.15}>
        <p
          className="max-w-[520px] text-center font-light leading-relaxed text-[#D7E2EA]/80"
          style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.3rem)' }}
        >
          Open to Data Scientist, AI Engineer and Full Stack roles — or any project
          that needs both the product and the intelligence behind it.
        </p>
      </FadeIn>

      <FadeIn delay={0.3} className="flex flex-wrap items-center justify-center gap-4">
        {LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="cursor-target flex items-center gap-3 rounded-xl border-2 border-[#D7E2EA]/40 px-6 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:border-[#D7E2EA] hover:bg-[#D7E2EA]/10 sm:px-8"
          >
            <Icon size={18} />
            {label}
          </a>
        ))}
        <a
          href="/cv.pdf"
          download="CV_Mohammed_Fakir.pdf"
          className="cursor-target flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-200 hover:brightness-125 sm:px-8"
          style={{
            background:
              'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
          }}
        >
          <Download size={18} />
          Download CV
        </a>
      </FadeIn>

      <footer className="mt-16 text-center text-xs font-light uppercase tracking-widest text-[#D7E2EA]/40">
        Designed &amp; built by Mohammed Fakir · Casablanca · © 2026
      </footer>
    </section>
  );
}
