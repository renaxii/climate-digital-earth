interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/72">{eyebrow}</p>
      <h2 className="font-display text-2xl tracking-tight text-white sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-6 text-white/68">{description}</p> : null}
    </div>
  );
}
