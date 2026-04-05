"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/friends", label: "Friends" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/activities", label: "Activities" },
  { href: "/calculators", label: "Calculators" },
  { href: "/routines", label: "Routines" },
  { href: "/insights", label: "Insights" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-300/25 bg-[#03170f]/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-emerald-200/35 bg-emerald-950/50 shadow-lg shadow-emerald-500/30">
              <Image src="/images/howlogo.png" alt="HOW logo" width={48} height={48} className="h-full w-full object-cover" priority />
            </span>
            <span className="leading-none">
              HOW
              <span className="ml-2 text-sm font-medium uppercase tracking-[0.22em] text-emerald-100/85">
                Health Over Wealth
              </span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-emerald-200/35 bg-[#0a2a1c]/85 px-3 py-1 text-xs font-semibold text-emerald-100 md:inline-flex">
            Build Better Habits
          </span>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap pb-1 md:justify-end">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                pathname === item.href
                  ? "bg-[linear-gradient(95deg,#34d399,#4ade80)] text-slate-950 shadow-md shadow-emerald-500/40"
                  : "app-pill text-emerald-50 hover:border-emerald-200/50 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
