interface LiveProjectButtonProps {
  label?: string;
  href: string;
}

export default function LiveProjectButton({
  label = 'View Code',
  href,
}: LiveProjectButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="cursor-target inline-block rounded-xl border-2 border-[#D7E2EA] px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10"
    >
      {label}
    </a>
  );
}
