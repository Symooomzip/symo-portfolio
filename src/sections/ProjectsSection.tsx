import { useRef } from 'react';
import { ArrowUpRight, Github } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import LiveProjectButton from '../components/LiveProjectButton';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ----------------------------------------------------------------
   "Adaptive Dossiers" cards — each project keeps the same skeleton
   (number → title → action, big radii, sticky-stack scroll) but the
   body is a spec column + a project-specific instrument panel.
----------------------------------------------------------------- */

type InstrumentKind = 'retrieval' | 'histogram' | 'segmentation' | 'clusters';

interface Metric {
  kind: 'ring' | 'bar' | 'counter' | 'stat';
  value: number; // ring/bar: 0..1 — counter/stat: target number
  display: string; // final text shown ("0.88", "10", "3")
  suffix?: string; // appended to counter/stat ("K+", "×")
  label: string;
}

interface Project {
  num: string;
  name: string;
  eyebrow: string;
  accent: string;
  href?: string;
  ndaPill?: string;
  specs: { label: string; value?: string; redacted?: boolean }[];
  chips: string[];
  metric: Metric;
  instrument: InstrumentKind;
  instrumentCaption: string;
  instrumentTag: string;
}

const PROJECTS: Project[] = [
  {
    num: '01',
    name: 'AI Legal Assistant',
    eyebrow: 'GEN AI · RAG — MOROCCAN LAW',
    accent: '#7621B0',
    href: 'https://github.com/Symooomzip/AI-Legal-Assistant-Moroccan-Law---RAG-based-System',
    specs: [
      { label: 'TASK', value: 'RAG PIPELINE' },
      { label: 'DATA', value: 'LEGAL CORPUS (MA)' },
    ],
    chips: ['PYTHON', 'LANGCHAIN', 'CHROMADB', 'LLM'],
    metric: { kind: 'stat', value: 3, display: '3', suffix: '×', label: 'CITED SOURCES / ANSWER' },
    instrument: 'retrieval',
    instrumentCaption: 'INSTRUMENT: RETRIEVAL TRACE — TOP-3 CITATIONS',
    instrumentTag: 'SCREENSHOT SLOT — CHAT UI',
  },
  {
    num: '02',
    name: 'Market Sentiment AI',
    eyebrow: 'BIG DATA · NLP PIPELINE',
    accent: '#B600A8',
    href: 'https://github.com/Symooomzip/big-data-bi-project',
    specs: [
      { label: 'TASK', value: 'SENTIMENT ANALYSIS' },
      { label: 'DATA', value: 'NEWS + SOCIAL FEEDS' },
    ],
    chips: ['PYTHON', 'MONGODB', 'NLP', 'POWER BI'],
    metric: { kind: 'counter', value: 10, display: '10', suffix: 'K+', label: 'ARTICLES SCRAPED' },
    instrument: 'histogram',
    instrumentCaption: 'INSTRUMENT: SENTIMENT HISTOGRAM — 10K DOCS',
    instrumentTag: 'SCREENSHOT SLOT — PBI DASHBOARDS',
  },
  {
    num: '03',
    name: 'Oil Spill Detection',
    eyebrow: 'COMPUTER VISION · SATELLITE IMAGERY',
    accent: '#BE4C00',
    href: 'https://github.com/Symooomzip/oil-spill-detection-ml',
    specs: [
      { label: 'TASK', value: 'SEGMENTATION' },
      { label: 'DATA', value: 'SAR SATELLITE' },
    ],
    chips: ['PYTORCH', 'CNN + TRANSFORMER', 'GRADIO'],
    metric: { kind: 'ring', value: 0.88, display: '0.88', label: 'IoU — TEST SET' },
    instrument: 'segmentation',
    instrumentCaption: 'INSTRUMENT: SEGMENTATION FIELD',
    instrumentTag: 'SCREENSHOT SLOT — GRADIO DEMO',
  },
  {
    num: '04',
    name: 'CLV — Dislog Group',
    eyebrow: 'DATA SCIENCE · CLIENT — DISLOG GROUP',
    accent: '#B600A8',
    ndaPill: 'NDA · PRIVATE REPO',
    specs: [
      { label: 'CLIENT', redacted: true },
      { label: 'DWH', value: 'CONSTELLATION' },
    ],
    chips: ['XGBOOST', 'K-MEANS', 'RFM', 'POWER BI'],
    metric: { kind: 'bar', value: 0.81, display: '0.81', label: 'CHURN AUC-ROC' },
    instrument: 'clusters',
    instrumentCaption: 'INSTRUMENT: RFM SEGMENTS — 4 CLUSTERS · ANONYMIZED',
    instrumentTag: 'NO SCREENSHOT — BY DESIGN',
  },
];

/* ------------------------- metric gauges ------------------------- */

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function MetricGauge({ metric, accent }: { metric: Metric; accent: string }) {
  if (metric.kind === 'ring') {
    return (
      <div className="flex items-center gap-4 pt-4">
        <svg width="104" height="104" viewBox="0 0 120 120" className="flex-none">
          <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(215,226,234,.1)" strokeWidth="7" />
          <circle
            className="gauge-ring-fill"
            data-value={metric.value}
            cx="60"
            cy="60"
            r={RING_R}
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`0 ${RING_C}`}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="58" textAnchor="middle" fill="#D7E2EA" fontFamily="Kanit" fontWeight="800" fontSize="26">
            {metric.display}
          </text>
          <text x="60" y="76" textAnchor="middle" fill="rgba(215,226,234,.45)" fontSize="9" letterSpacing="2" className="font-mono">
            IoU
          </text>
        </svg>
        <div className="font-mono text-[10px] leading-relaxed tracking-[.15em] text-[#D7E2EA]/45">
          {metric.label}
        </div>
      </div>
    );
  }

  if (metric.kind === 'bar') {
    return (
      <div className="pt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[.15em] text-[#D7E2EA]/45">{metric.label}</span>
          <span className="font-black text-[#D7E2EA]" style={{ fontSize: '15px' }}>
            {metric.display}
          </span>
        </div>
        <div className="relative h-[5px] rounded-[3px] bg-[#D7E2EA]/10">
          <div
            className="gauge-bar-fill absolute bottom-0 left-0 top-0 origin-left rounded-[3px]"
            style={{
              width: `${metric.value * 100}%`,
              background: `linear-gradient(90deg, #7621B0, ${accent})`,
            }}
          />
        </div>
      </div>
    );
  }

  // counter / stat — big number with count-up
  return (
    <div className="pt-4">
      <div
        className="count-up font-black leading-none"
        data-target={metric.value}
        data-suffix={metric.suffix ?? ''}
        style={{
          fontSize: 'clamp(2.6rem, 4vw, 3.6rem)',
          background: `linear-gradient(123deg, ${accent}, #7621B0)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {metric.display}
        {metric.suffix}
      </div>
      <div className="mt-1 font-mono text-[10px] tracking-[.3em] text-[#D7E2EA]/40">{metric.label}</div>
    </div>
  );
}

/* ------------------------- instruments ------------------------- */

const SCANLINES = 'repeating-linear-gradient(0deg, rgba(215,226,234,.03) 0 1px, transparent 1px 7px)';
const GRIDLINES =
  'repeating-linear-gradient(90deg, rgba(215,226,234,.025) 0 1px, transparent 1px 44px), repeating-linear-gradient(0deg, rgba(215,226,234,.025) 0 1px, transparent 1px 44px)';

function SegmentationInstrument() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: SCANLINES }} />
      <div
        className="inst-item absolute rounded-md border border-dashed"
        style={{ left: '48%', top: '40%', width: '38%', height: '32%', borderColor: 'rgba(190,76,0,.9)' }}
      />
      <div className="inst-item absolute font-mono text-[10px] tracking-[.15em] text-[#BE4C00]" style={{ left: '48%', top: 'calc(40% - 22px)' }}>
        SPILL · CONF 0.91
      </div>
      <div
        className="inst-item absolute rounded-md border border-dashed"
        style={{ left: '16%', top: '20%', width: '24%', height: '22%', borderColor: 'rgba(215,226,234,.4)' }}
      />
      <div
        className="inst-item absolute font-mono text-[10px] tracking-[.15em] text-[#D7E2EA]/50"
        style={{ left: '16%', top: 'calc(20% + 26%)' }}
      >
        VESSEL · IGNORED
      </div>
    </>
  );
}

const CLUSTER_DOTS: { x: number; y: number; s: number; c: string; o: number }[] = [
  { x: 18, y: 28, s: 13, c: '#B600A8', o: 1 },
  { x: 23, y: 38, s: 9, c: '#B600A8', o: 0.75 },
  { x: 14, y: 44, s: 10, c: '#B600A8', o: 0.6 },
  { x: 27, y: 24, s: 8, c: '#B600A8', o: 0.5 },
  { x: 46, y: 60, s: 13, c: '#7621B0', o: 1 },
  { x: 52, y: 70, s: 9, c: '#7621B0', o: 0.7 },
  { x: 41, y: 72, s: 10, c: '#7621B0', o: 0.6 },
  { x: 72, y: 30, s: 13, c: '#BE4C00', o: 1 },
  { x: 78, y: 40, s: 9, c: '#BE4C00', o: 0.7 },
  { x: 68, y: 42, s: 8, c: '#BE4C00', o: 0.55 },
  { x: 80, y: 66, s: 11, c: '#BBCCD7', o: 0.8 },
  { x: 74, y: 74, s: 8, c: '#BBCCD7', o: 0.5 },
  { x: 86, y: 58, s: 8, c: '#BBCCD7', o: 0.6 },
];

function ClustersInstrument() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: GRIDLINES }} />
      {CLUSTER_DOTS.map((d, i) => (
        <div
          key={i}
          className="inst-item absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            background: d.c,
            opacity: d.o,
          }}
        />
      ))}
    </>
  );
}

const HIST_BARS = [22, 38, 30, 55, 44, 70, 62, 85, 58, 92, 74, 66, 88, 52, 78, 40, 60, 34, 48, 28, 42, 24, 36, 18];

function HistogramInstrument() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: SCANLINES }} />
      <div className="absolute inset-x-6 bottom-10 top-10 flex items-end gap-[3%]">
        {HIST_BARS.map((h, i) => (
          <div
            key={i}
            className="hist-bar flex-1 origin-bottom rounded-t-sm"
            style={{
              height: `${h}%`,
              background:
                i % 3 === 0
                  ? 'linear-gradient(180deg, #B600A8, rgba(182,0,168,.25))'
                  : i % 3 === 1
                    ? 'linear-gradient(180deg, #7621B0, rgba(118,33,176,.25))'
                    : 'linear-gradient(180deg, rgba(187,204,215,.7), rgba(187,204,215,.15))',
            }}
          />
        ))}
      </div>
    </>
  );
}

function RetrievalInstrument() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: SCANLINES }} />
      <div className="absolute inset-x-6 top-8 flex flex-col gap-3 sm:inset-x-8">
        <div className="inst-item font-mono text-[11px] tracking-[.12em] text-[#D7E2EA]/80">
          › Q: EMPLOYMENT TERMINATION CONDITIONS?
        </div>
        <div className="inst-item font-mono text-[10px] tracking-[.2em] text-[#D7E2EA]/35">
          RETRIEVING… TOP-3 BY COSINE SIMILARITY
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['ART. 35 — LABOR CODE', '0.92'],
            ['ART. 41 — LABOR CODE', '0.88'],
            ['DAHIR 1-03-194', '0.84'],
          ].map(([src, score]) => (
            <span
              key={src}
              className="inst-item rounded-md border border-[#7621B0]/60 bg-[#18011F]/60 px-3 py-1.5 font-mono text-[10px] tracking-[.1em] text-[#D7E2EA]/85"
            >
              {src} <span className="text-[#B600A8]">· {score}</span>
            </span>
          ))}
        </div>
        <div className="inst-item font-mono text-[11px] leading-relaxed tracking-[.08em] text-[#D7E2EA]/60">
          › A: PER ARTICLE 35, TERMINATION REQUIRES VALID GROUNDS… <span className="text-[#7621B0]">[3 SOURCES]</span>
        </div>
      </div>
    </>
  );
}

const INSTRUMENT_BG: Record<InstrumentKind, string> = {
  segmentation:
    'radial-gradient(400px 260px at 66% 30%, rgba(118,33,176,.5), transparent 70%), radial-gradient(280px 200px at 26% 74%, rgba(182,0,168,.28), transparent 70%), radial-gradient(170px 140px at 55% 58%, rgba(190,76,0,.85), transparent 68%), linear-gradient(165deg, #18011F 0%, #0d0f11 60%, #121414 100%)',
  clusters:
    'radial-gradient(500px 300px at 50% 50%, rgba(24,1,31,.9), transparent 90%), linear-gradient(150deg, #141117 0%, #101213 100%)',
  histogram:
    'radial-gradient(420px 260px at 30% 30%, rgba(182,0,168,.28), transparent 70%), radial-gradient(300px 220px at 75% 70%, rgba(118,33,176,.35), transparent 70%), linear-gradient(160deg, #18011F 0%, #0e0f12 58%, #121414 100%)',
  retrieval:
    'radial-gradient(420px 280px at 70% 20%, rgba(118,33,176,.4), transparent 70%), radial-gradient(280px 200px at 20% 80%, rgba(182,0,168,.22), transparent 70%), linear-gradient(160deg, #18011F 0%, #0e0f12 58%, #121414 100%)',
};

const INSTRUMENTS: Record<InstrumentKind, () => JSX.Element> = {
  segmentation: SegmentationInstrument,
  clusters: ClustersInstrument,
  histogram: HistogramInstrument,
  retrieval: RetrievalInstrument,
};

/* ------------------------- card ------------------------- */

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const Instrument = INSTRUMENTS[project.instrument];

  return (
    <div className="card-wrapper sticky top-0 flex h-screen items-center justify-center">
      <div
        className="project-card relative w-full rounded-[40px] border border-[#D7E2EA]/15 bg-[#16181A] p-6 sm:rounded-[50px] sm:p-8 md:rounded-[60px] md:p-10"
        style={{ top: `calc(-4vh + ${index * 28}px)`, transformOrigin: 'center top' }}
      >
        {/* header */}
        <div className="flex flex-wrap items-start gap-4 sm:gap-7">
          <div
            className="hero-heading flex-none font-black"
            style={{ fontSize: 'clamp(3rem, 6vw, 76px)', lineHeight: 0.85 }}
          >
            {project.num}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <span
                className="font-mono text-[10px] tracking-[.3em]"
                style={{ color: project.accent }}
              >
                {project.eyebrow}
              </span>
              {project.ndaPill && (
                <span className="rounded-[3px] border border-[#B600A8]/55 bg-[#18011F] px-2 py-[3px] font-mono text-[9px] tracking-[.25em] text-[#D7E2EA]">
                  CONFIDENTIAL
                </span>
              )}
            </div>
            <h3
              className="font-extrabold uppercase leading-none text-[#D7E2EA]"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 38px)' }}
            >
              {project.name}
            </h3>
          </div>
          <div className="flex-none">
            {project.href ? (
              <LiveProjectButton href={project.href} />
            ) : (
              <span className="inline-block rounded-full border border-dashed border-[#D7E2EA]/25 px-6 py-2.5 font-mono text-[11px] tracking-[.2em] text-[#D7E2EA]/45 sm:px-8">
                {project.ndaPill}
              </span>
            )}
          </div>
        </div>

        {/* body: spec column + instrument */}
        <div className="mt-7 grid gap-6 sm:mt-9 md:grid-cols-[300px_1fr] md:gap-9">
          {/* instrument first on mobile */}
          <div
            className="relative order-1 min-h-[240px] overflow-hidden rounded-[24px] sm:min-h-[300px] md:order-2 md:min-h-[340px] md:rounded-[28px]"
            style={{ background: INSTRUMENT_BG[project.instrument] }}
          >
            <Instrument />
            <div className="absolute right-4 top-4 rounded border border-dashed border-[#D7E2EA]/25 px-2.5 py-1 font-mono text-[9px] tracking-[.2em] text-[#D7E2EA]/40">
              {project.instrumentTag}
            </div>
            <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[.2em] text-[#D7E2EA]/45">
              {project.instrumentCaption}
            </div>
          </div>

          {/* spec column */}
          <div className="order-2 flex flex-col md:order-1">
            {project.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between border-b border-[#D7E2EA]/10 py-3.5 font-mono text-[11px] tracking-[.12em]"
              >
                <span className="text-[#D7E2EA]/40">{spec.label}</span>
                {spec.redacted ? (
                  <span className="inline-block h-[9px] w-24 rounded-sm bg-[#D7E2EA]/15" />
                ) : (
                  <span className="text-[#D7E2EA]">{spec.value}</span>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 py-3.5">
              {project.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#D7E2EA]/20 px-3 py-1 font-mono text-[10px] tracking-[.1em] text-[#D7E2EA]/70"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-auto">
              <MetricGauge metric={project.metric} accent={project.accent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- section ------------------------- */

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

      // per-card entrance: gauges draw, counters count, instruments assemble
      cards.forEach((card) => {
        const enter = gsap.timeline({
          scrollTrigger: { trigger: card, start: 'top 78%', once: true },
        });

        const ring = card.querySelector<SVGCircleElement>('.gauge-ring-fill');
        if (ring) {
          const value = Number(ring.dataset.value ?? 0);
          enter.fromTo(
            ring,
            { strokeDasharray: `0 ${RING_C}` },
            { strokeDasharray: `${value * RING_C} ${RING_C}`, duration: 1.2, ease: 'power2.out' },
            0,
          );
        }

        card.querySelectorAll<HTMLElement>('.gauge-bar-fill').forEach((el) => {
          enter.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.out' }, 0.1);
        });

        card.querySelectorAll<HTMLElement>('.count-up').forEach((el) => {
          const target = Number(el.dataset.target ?? 0);
          const suffix = el.dataset.suffix ?? '';
          const counter = { v: 0 };
          enter.to(
            counter,
            {
              v: target,
              duration: 1.2,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = `${Math.round(counter.v)}${suffix}`;
              },
            },
            0,
          );
        });

        const instItems = card.querySelectorAll<HTMLElement>('.inst-item');
        if (instItems.length) {
          enter.fromTo(
            instItems,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' },
            0.15,
          );
        }

        const bars = card.querySelectorAll<HTMLElement>('.hist-bar');
        if (bars.length) {
          enter.fromTo(
            bars,
            { scaleY: 0 },
            { scaleY: 1, stagger: 0.025, duration: 0.6, ease: 'power2.out' },
            0.15,
          );
        }
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

      {/* closes the stack: the rest of the work lives on GitHub */}
      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center gap-6 sm:mt-20 md:mt-24">
        <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#D7E2EA]/25 to-transparent" />
        <p
          className="text-center font-light uppercase tracking-widest text-[#D7E2EA]/60"
          style={{ fontSize: 'clamp(0.8rem, 1.4vw, 1rem)' }}
        >
          More projects on GitHub
        </p>
        <a
          href="https://github.com/Symooomzip"
          target="_blank"
          rel="noreferrer"
          className="cursor-target group flex items-center gap-3 rounded-xl border-2 border-[#D7E2EA]/40 px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:border-[#D7E2EA] hover:bg-[#D7E2EA]/10 sm:px-10 sm:text-base"
        >
          <Github size={20} />
          Explore all repositories
          <ArrowUpRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </div>
    </section>
  );
}
