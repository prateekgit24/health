"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

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
    <header className="sticky top-0 z-50 border-b border-primary-300/20 bg-white dark:bg-linear-to-b dark:from-[#03170f] dark:to-[#010b08] shadow-sm dark:shadow-lg dark:shadow-primary-950/40 backdrop-blur-sm dark:backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-primary-300/40 bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-950/50 dark:to-primary-900/30 dark:border-primary-300/30 shadow-md dark:shadow-lg dark:shadow-primary-500/20">
              <Image
                src="/images/howlogo.png"
                alt="HOW logo"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="leading-none">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                HOW
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-200/80 leading-tight">
                Health Over Wealth
              </div>
            </div>
          </Link>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex text-xs font-semibold uppercase tracking-[0.12em] text-primary-600 dark:text-primary-200/70 px-4 py-2 rounded-full border border-primary-200/40 dark:border-primary-300/20 bg-primary-50/60 dark:bg-primary-950/30">
              Build Better Habits
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-3 overflow-x-auto pb-1">
          <div className="flex w-max gap-1 pr-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap sm:px-3 sm:py-2 sm:text-sm ${
                      isActive
                        ? "bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-md dark:from-primary-400 dark:to-primary-500 dark:text-slate-950 dark:shadow-lg dark:shadow-primary-500/30"
                        : "text-slate-700 hover:text-slate-900 dark:text-primary-100/80 dark:hover:text-primary-100 hover:bg-primary-100/40 dark:hover:bg-primary-900/30 border border-transparent dark:border-transparent hover:border-primary-300/50 dark:hover:border-primary-400/30"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </div>
        </nav>
      </div>
    </header>
  );
}
