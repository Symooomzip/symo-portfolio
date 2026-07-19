import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import LiveProjectButton from '../components/LiveProjectButton';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Project {
  num: string;
  name: string;
  category: string;
  href: string;
  gradients: [string, string, string]; // placeholder visuals until real screenshots land
  labels: [string, string, string];
}

const PROJECTS: Project[] = [
  {
    num: '01',
    name: 'AI Legal Assistant',
    category: 'AI · RAG',
    href: 'https://github.com/Symooomzip/AI-Legal-Assistant-Moroccan-Law---RAG-based-System',
    gradients: [
      'radial-gradient(circle at 30% 30%, rgba(182,0,168,0.5), transparent 70%), linear-gradient(140deg, #18011F 0%, #2a0a33 100%)',
      'radial-gradient(circle at 70% 60%, rgba(118,33,176,0.55), transparent 70%), linear-gradient(200deg, #140118 0%, #1f0429 100%)',
      'radial-gradient(circle at 50% 20%, rgba(190,76,0,0.35), transparent 60%), linear-gradient(160deg, #18011F 0%, #35104a 100%)',
    ],
    labels: ['LangChain', 'ChromaDB', 'Moroccan Law · LLM'],
  },
  {
    num: '02',
    name: 'Market Sentiment AI',
    category: 'Big Data · NLP',
    href: 'https://github.com/Symooomzip/big-data-bi-project',
    gradients: [
      'radial-gradient(circle at 25% 70%, rgba(118,33,176,0.5), transparent 70%), linear-gradient(120deg, #0d0d1f 0%, #1a1033 100%)',
      'radial-gradient(circle at 80% 30%, rgba(182,0,168,0.4), transparent 65%), linear-gradient(220deg, #0a0a18 0%, #241040 100%)',
      'radial-gradient(circle at 40% 80%, rgba(190,76,0,0.4), transparent 60%), linear-gradient(150deg, #100c20 0%, #2c1548 100%)',
    ],
    labels: ['10k+ articles', 'NLP · MongoDB', 'Power BI dashboards'],
  },
  {
    num: '03',
    name: 'Oil Spill Detection',
    category: 'Computer Vision',
    href: 'https://github.com/Symooomzip/oil-spill-detection-ml',
    gradients: [
      'radial-gradient(circle at 60% 40%, rgba(0,120,190,0.4), transparent 70%), linear-gradient(140deg, #01131f 0%, #0a2233 100%)',
      'radial-gradient(circle at 20% 60%, rgba(182,0,168,0.35), transparent 65%), linear-gradient(200deg, #010f18 0%, #04293f 100%)',
      'radial-gradient(circle at 70% 70%, rgba(118,33,176,0.4), transparent 60%), linear-gradient(160deg, #02141f 0%, #123350 100%)',
    ],
    labels: ['Satellite imagery', 'IoU 0.88', 'CNN · Transformers · Gradio'],
  },
];

function PlaceholderImage({
  gradient,
  label,
  className,
  style,
}: {
  gradient: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`flex items-end rounded-[40px] p-6 sm:rounded-[50px] md:rounded-[60px] ${className ?? ''}`}
      style={{ background: gradient, ...style }}
    >
      <span className="text-xs font-medium uppercase tracking-widest text-white/60 sm:text-sm">
        {label}
      </span>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <div className="card-wrapper sticky top-0 flex h-screen items-center justify-center">
      <div
        className="project-card relative w-full rounded-[40px] border-2 border-[#D7E2EA] bg-[#121414] p-4 sm:rounded-[50px] sm:p-6 md:rounded-[60px] md:p-8"
        style={{ top: `calc(-4vh + ${index * 28}px)`, transformOrigin: 'center top' }}
      >
        {/* top row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 px-2 sm:mb-6 sm:px-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <span
              className="hero-heading font-black leading-none"
              style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
            >
              {project.num}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-light uppercase tracking-widest text-[#D7E2EA]/60 sm:text-sm">
                {project.category}
              </span>
              <span
                className="font-medium uppercase text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1.1rem, 2.6vw, 2.4rem)' }}
              >
                {project.name}
              </span>
            </div>
          </div>
          <LiveProjectButton href={project.href} />
        </div>

        {/* image grid */}
        <div className="flex gap-3 sm:gap-4">
          <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
            <PlaceholderImage
              gradient={project.gradients[0]}
              label={project.labels[0]}
              style={{ height: 'clamp(130px, 16vw, 230px)' }}
            />
            <PlaceholderImage
              gradient={project.gradients[1]}
              label={project.labels[1]}
              style={{ height: 'clamp(160px, 22vw, 340px)' }}
            />
          </div>
          <div className="w-[60%]">
            <PlaceholderImage
              gradient={project.gradients[2]}
              label={project.labels[2]}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.project-card');
      const total = cards.length;
      // one scrubbed timeline over the whole stack: card i starts shrinking
      // when card i+1 begins covering it, and settles at its stacked scale
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
      cards.forEach((card, i) => {
        const targetScale = 1 - (total - 1 - i) * 0.045;
        if (targetScale >= 1) return;
        tl.fromTo(
          card,
          { scale: 1 },
          { scale: targetScale, ease: 'none', duration: 1 - i / total },
          i / total,
        );
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#121414] px-5 pb-24 pt-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pt-28"
    >
      <h2
        className="hero-heading mb-10 text-center font-black uppercase leading-none tracking-tight sm:mb-14 md:mb-20"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Projects
      </h2>

      <div ref={containerRef} className="mx-auto max-w-6xl">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.num} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
