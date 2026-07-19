interface ContactButtonProps {
  label?: string;
  href?: string;
}

export default function ContactButton({
  label = 'Contact Me',
  href = '#contact',
}: ContactButtonProps) {
  return (
    <a
      href={href}
      className="cursor-target inline-block rounded-xl px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base font-medium uppercase tracking-widest text-white transition-all duration-200 hover:brightness-125"
      style={{
        background:
          'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
      }}
    >
      {label}
    </a>
  );
}
