import { useMemo } from 'react';
import LogoLoop, { type LogoItem } from '../components/LogoLoop';

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

function TechChip({ item }: { item: TechItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 sm:px-5 sm:py-3">
      {item.icon && (
        <img src={item.icon} alt="" aria-hidden className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
      )}
      <span
        className="whitespace-nowrap text-[13px] font-medium uppercase tracking-widest sm:text-sm"
        style={{ color: item.accent ?? 'rgba(215,226,234,.7)' }}
      >
        {item.name}
      </span>
    </div>
  );
}

const toLogos = (items: TechItem[]): LogoItem[] =>
  items.map((item) => ({ node: <TechChip item={item} />, ariaLabel: item.name }));

export default function MarqueeSection() {
  // memoised so LogoLoop's memo() holds and its resize/image effects don't
  // re-run on every parent render
  const row1 = useMemo(() => toLogos(ROW_1), []);
  const row2 = useMemo(() => toLogos(ROW_2), []);

  return (
    <section className="flex flex-col gap-3 overflow-hidden bg-[#121414] pb-10 pt-24 sm:pt-32 md:pt-40">
      <LogoLoop
        logos={row1}
        direction="left"
        speed={38}
        gap={12}
        fadeOut
        fadeOutColor="#121414"
        scaleOnHover
        ariaLabel="Machine learning and data tools"
      />
      <LogoLoop
        logos={row2}
        direction="right"
        speed={38}
        gap={12}
        fadeOut
        fadeOutColor="#121414"
        scaleOnHover
        ariaLabel="Web, mobile and infrastructure tools"
      />
    </section>
  );
}
