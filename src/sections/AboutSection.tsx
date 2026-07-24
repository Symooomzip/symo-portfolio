import FadeIn from '../components/FadeIn';
import AnimatedText from '../components/AnimatedText';

// NOTE: if you change this, mirror it in functions/_kb.ts (chatbot knowledge base).
const ABOUT_TEXT =
  "With a Master in Data Science & AI and a degree in Full Stack Development, I build intelligent products end to end — from data pipelines and machine learning models to the web apps that ship them. Let's build something incredible together!";

type ShapeVariant = 'sphere' | 'ring' | 'crescent' | 'diamond';

function CornerShape({
  variant,
  className,
  float = 'float-slow',
}: {
  variant: ShapeVariant;
  className?: string;
  float?: string;
}) {
  const glow = { filter: 'drop-shadow(0 0 40px rgba(118, 33, 176, 0.45))' };

  if (variant === 'sphere') {
    return (
      <div className={`${float} ${className ?? ''}`} style={glow}>
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5) 0%, #B600A8 35%, #7621B0 65%, #18011F 100%)',
          }}
        />
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className={`${float} ${className ?? ''}`} style={glow}>
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'conic-gradient(from 40deg, #B600A8 0%, #7621B0 30%, #BBCCD7 55%, #B600A8 100%)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 22%), #000 calc(100% - 20%))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 22%), #000 calc(100% - 20%))',
          }}
        />
      </div>
    );
  }

  if (variant === 'crescent') {
    return (
      <div className={`${float} ${className ?? ''}`} style={glow}>
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(circle at 68% 35%, transparent 0%, transparent 44%, #7621B0 46%, #B600A8 72%, #18011F 100%)',
          }}
        />
      </div>
    );
  }

  // diamond
  return (
    <div className={`${float} ${className ?? ''}`} style={glow}>
      <div
        className="h-full w-full rotate-45 rounded-[22%]"
        style={{
          background:
            'linear-gradient(135deg, #BBCCD7 0%, #7621B0 45%, #B600A8 75%, #18011F 100%)',
        }}
      />
    </div>
  );
}

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-5 py-20 sm:gap-14 sm:px-8 md:gap-16 md:px-10"
    >
      {/* decorative corner tiles */}
      <FadeIn
        delay={0.1}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute left-[1%] top-[4%] sm:left-[2%] md:left-[4%]"
      >
        <CornerShape variant="sphere" className="h-[90px] w-[90px] sm:h-[120px] sm:w-[120px] md:h-[150px] md:w-[150px]" />
      </FadeIn>
      <FadeIn
        delay={0.25}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]"
      >
        <CornerShape variant="crescent" float="float-slower" className="h-[75px] w-[75px] sm:h-[100px] sm:w-[100px] md:h-[130px] md:w-[130px]" />
      </FadeIn>
      <FadeIn
        delay={0.15}
        x={80}
        y={0}
        duration={0.9}
        className="absolute right-[1%] top-[4%] sm:right-[2%] md:right-[4%]"
      >
        <CornerShape variant="ring" float="float-slower" className="h-[90px] w-[90px] sm:h-[120px] sm:w-[120px] md:h-[150px] md:w-[150px]" />
      </FadeIn>
      <FadeIn
        delay={0.3}
        x={80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]"
      >
        <CornerShape variant="diamond" className="h-[95px] w-[95px] sm:h-[125px] sm:w-[125px] md:h-[160px] md:w-[160px]" />
      </FadeIn>

      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading text-center font-black uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          About me
        </h2>
      </FadeIn>

      <AnimatedText
        text={ABOUT_TEXT}
        className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
      />
    </section>
  );
}
