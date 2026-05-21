import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { width: 100, height: 22 },
  md: { width: 160, height: 36 },
  lg: { width: 220, height: 48 },
  xl: { width: 280, height: 62 },
} as const;

type LogoProps = {
  className?: string;
  size?: keyof typeof SIZES;
  priority?: boolean;
};

export function Logo({ className, size = "md", priority }: LogoProps) {
  const { width, height } = SIZES[size];

  return (
    <Image
      src="/logo-pulse.png"
      alt="PULSE"
      width={width}
      height={height}
      className={cn("h-auto max-w-full object-contain", className)}
      priority={priority}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return <Logo size="sm" className={className} />;
}
