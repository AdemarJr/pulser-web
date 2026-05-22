import Link from "next/link";
import Image from "next/image";

export function PortalHeader() {
  return (
    <header className="border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <Image
            src="/logo-pulse.png"
            alt="PULSE"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground">PULSE</span>
          <span className="hidden text-sm text-muted sm:inline">Participação</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Área da equipe
        </Link>
      </div>
    </header>
  );
}
