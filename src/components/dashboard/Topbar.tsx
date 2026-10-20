import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Topbar({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="h-16 border-b border-line flex items-center justify-between px-4 md:px-8 bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <div className="md:hidden">
          <Logo href="/dashboard" />
        </div>
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Link href="/dashboard/new" className="md:hidden btn-gold rounded-full px-3 py-1.5 text-sm">
          New
        </Link>
      </div>
    </header>
  );
}
