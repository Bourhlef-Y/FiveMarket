"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showBackground?: boolean;
  withShadow?: boolean;
  href?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
  hero: 'text-5xl md:text-6xl lg:text-7xl'
};

export default function Logo({ 
  size = 'md', 
  className,
  showBackground = false,
  withShadow = false,
  href = "/"
}: LogoProps) {
  const logoContent = (
    <span 
      className={cn(
        "font-teko font-semibold tracking-wide text-white",
        sizeClasses[size],
        className
      )}
      style={withShadow ? {
        textShadow: "0px 0px 27.3px rgba(255, 255, 255, 0.5)"
      } : undefined}
    >
      <span className="text-[#FF7101]">Five</span>Market
    </span>
  );

  const content = showBackground ? (
    <div className="relative bg-[#18181B] px-4 py-2">
      {logoContent}
    </div>
  ) : logoContent;

  return (
    <Link href={href} className="inline-block">
      {content}
    </Link>
  );
}