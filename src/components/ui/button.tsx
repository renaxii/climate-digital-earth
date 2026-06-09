import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface BaseButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
  href?: string;
  className?: string;
}

type ButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({ className, variant = "primary", children, href, ...props }: ButtonProps) {
  const base = "focus-ring inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-white text-slate-950 shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 hover:bg-cyan-50",
    secondary: "bg-white/8 text-white ring-1 ring-white/14 hover:bg-white/14",
    ghost: "text-white/82 hover:bg-white/8"
  };

  if (href) {
    return (
      <Link className={cn(base, variants[variant], className)} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
