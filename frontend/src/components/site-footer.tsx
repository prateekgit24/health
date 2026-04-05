import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/help", label: "Help" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-emerald-200/20 bg-[#02120c]/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-semibold text-emerald-50">HOW | Health Over Wealth</p>
          <p className="max-w-2xl text-xs text-emerald-100/75">
            Build habits. Track progress. Live stronger. Profile-based health and fitness planning for real-world consistency.
          </p>
        </div>
        <nav className="mt-5 flex flex-wrap justify-center gap-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-emerald-200/20 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-100 hover:border-emerald-200/45"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-5 text-center text-xs text-emerald-100/60">© {new Date().getFullYear()} HOW by Cosmics Software</p>
      </div>
    </footer>
  );
}
