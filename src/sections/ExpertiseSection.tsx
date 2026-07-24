import FadeIn from '../components/FadeIn';
import NeuralCanvas from '../components/NeuralCanvas';
import CanvasErrorBoundary from '../components/CanvasErrorBoundary';

// NOTE: if you change these, mirror them in functions/_kb.ts (chatbot knowledge base).
const SERVICES = [
  {
    num: '01',
    name: 'Machine Learning',
    description:
      'Design, training and evaluation of predictive models — churn prediction, customer segmentation, computer vision — with scikit-learn, XGBoost, PyTorch and TensorFlow.',
    chips: ['scikit-learn', 'XGBoost', 'PyTorch', 'TensorFlow'],
  },
  {
    num: '02',
    name: 'Generative AI',
    description:
      'LLM-powered systems built for production: RAG pipelines with vector databases, efficient fine-tuning with LoRA/PEFT, LangChain orchestration and Hugging Face deployment.',
    chips: ['LangChain', 'RAG', 'LoRA / PEFT', 'Hugging Face', 'ChromaDB'],
  },
  {
    num: '03',
    name: 'Data Engineering',
    description:
      'Complete ETL pipelines: extraction, cleaning and centralization of raw business data into data warehouses — SQL Server, MongoDB, MySQL — ready for analysis and modeling.',
    chips: ['ETL', 'SQL Server', 'MongoDB', 'MySQL'],
  },
  {
    num: '04',
    name: 'Full Stack Development',
    description:
      'Production web applications from front to back — MERN stack, .NET, REST APIs — plus mobile apps with Flutter and native Android.',
    chips: ['React', 'Node.js', '.NET', 'REST APIs', 'Flutter'],
  },
  {
    num: '05',
    name: 'Business Intelligence',
    description:
      'Power BI dashboards that turn KPIs into decisions — data modeling, DAX, and visual storytelling for business teams.',
    chips: ['Power BI', 'DAX', 'Excel'],
  },
];

export default function ExpertiseSection() {
  return (
    <section
      id="expertise"
      className="relative overflow-hidden rounded-t-[40px] bg-[#18011F] px-5 py-20 sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
    >
      {/* the neural field, glowing over deep plum */}
      <CanvasErrorBoundary>
        <NeuralCanvas
          variant="dark"
          scrollFade={false}
          fogColor={0x18011f}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </CanvasErrorBoundary>

      <div className="relative z-10">
        <FadeIn y={40}>
          <h2
            className="hero-heading mb-16 text-center font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Expertise
          </h2>
        </FadeIn>

        <div className="mx-auto max-w-5xl">
          {SERVICES.map((service, i) => (
            <FadeIn key={service.num} delay={i * 0.1}>
              <div
                className="group flex cursor-default flex-col gap-4 py-8 transition-transform duration-300 hover:translate-x-2 sm:flex-row sm:gap-10 sm:py-10 md:gap-14 md:py-12"
                style={{
                  borderBottom:
                    i < SERVICES.length - 1
                      ? '1px solid rgba(215, 226, 234, 0.14)'
                      : 'none',
                }}
              >
                <span
                  className="service-num hero-heading font-black leading-none"
                  style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
                >
                  {service.num}
                </span>
                <div className="flex flex-col justify-center gap-3">
                  <h3
                    className="font-medium uppercase text-[#D7E2EA]"
                    style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
                  >
                    {service.name}
                  </h3>
                  <p
                    className="max-w-2xl font-light leading-relaxed text-[#D7E2EA]"
                    style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)', opacity: 0.65 }}
                  >
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {service.chips.map((chip, ci) => (
                      <span
                        key={chip}
                        className="translate-y-1 rounded-full border border-[#D7E2EA]/25 px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-[#D7E2EA]/80 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100 sm:text-sm"
                        style={{ transitionDelay: `${ci * 45}ms` }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
