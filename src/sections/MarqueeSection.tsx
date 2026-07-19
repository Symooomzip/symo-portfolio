import { useEffect, useRef, useState } from 'react';

interface TechItem {
  name: string;
  icon?: string; // devicon URL; falls back to big text when absent
  accent?: string;
}

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

const ROW_1: TechItem[] = [
  { name: 'Python', icon: `${DEVICON}/python/python-original.svg` },
  { name: 'PyTorch', icon: `${DEVICON}/pytorch/pytorch-original.svg` },
  { name: 'TensorFlow', icon: `${DEVICON}/tensorflow/tensorflow-original.svg` },
  { name: 'scikit-learn', icon: `${DEVICON}/scikitlearn/scikitlearn-original.svg` },
  { name: 'XGBoost', accent: '#B600A8' },
  { name: 'LangChain', accent: '#7621B0' },
  { name: 'Hugging Face', accent: '#BE4C00' },
  { name: 'ChromaDB', accent: '#B600A8' },
  { name: 'MongoDB', icon: `${DEVICON}/mongodb/mongodb-original.svg` },
  { name: 'Power BI', accent: '#BE4C00' },
  { name: 'Jupyter', icon: `${DEVICON}/jupyter/jupyter-original.svg` },
];

const ROW_2: TechItem[] = [
  { name: 'React', icon: `${DEVICON}/react/react-original.svg` },
  { name: 'Node.js', icon: `${DEVICON}/nodejs/nodejs-original.svg` },
  { name: 'TypeScript', icon: `${DEVICON}/typescript/typescript-original.svg` },
  { name: '.NET', icon: `${DEVICON}/dotnetcore/dotnetcore-original.svg` },
  { name: 'SQL Server', icon: `${DEVICON}/microsoftsqlserver/microsoftsqlserver-plain.svg` },
  { name: 'MySQL', icon: `${DEVICON}/mysql/mysql-original.svg` },
  { name: 'Docker', icon: `${DEVICON}/docker/docker-original.svg` },
  { name: 'Git', icon: `${DEVICON}/git/git-original.svg` },
  { name: 'Flutter', icon: `${DEVICON}/flutter/flutter-original.svg` },
  { name: 'Java', icon: `${DEVICON}/java/java-original.svg` },
];

function Tile({ item }: { item: TechItem }) {
  return (
    <div
      className="flex h-[170px] w-[280px] flex-shrink-0 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03]"
      style={{ willChange: 'transform' }}
    >
      {item.icon ? (
        <img
          src={item.icon}
          alt={item.name}
          loading="lazy"
          className="h-16 w-16 object-contain"
        />
      ) : (
        <span
          className="text-3xl font-black uppercase"
          style={{ color: item.accent ?? '#D7E2EA' }}
        >
          {item.name}
        </span>
      )}
      {item.icon && (
        <span className="text-sm font-medium uppercase tracking-widest text-[#D7E2EA]/70">
          {item.name}
        </span>
      )}
    </div>
  );
}

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const sectionTop = el.offsetTop;
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.3);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const row1 = [...ROW_1, ...ROW_1, ...ROW_1];
  const row2 = [...ROW_2, ...ROW_2, ...ROW_2];

  return (
    <section
      ref={sectionRef}
      className="flex flex-col gap-3 bg-[#121414] pb-10 pt-24 sm:pt-32 md:pt-40"
    >
      <div
        className="flex gap-3"
        style={{ transform: `translateX(${offset - 200}px)`, willChange: 'transform' }}
      >
        {row1.map((item, i) => (
          <Tile key={`r1-${i}`} item={item} />
        ))}
      </div>
      <div
        className="flex gap-3"
        style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: 'transform' }}
      >
        {row2.map((item, i) => (
          <Tile key={`r2-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}
