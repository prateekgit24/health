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
    <footer className="mt-16 border-t border-primary-200/20 dark:border-primary-300/20 bg-primary-50 dark:bg-gradient-to-t dark:from-[#010b08] dark:to-[#020f0b]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              HOW
            </h3>
            <p className="text-sm text-slate-600 dark:text-primary-100/75 leading-relaxed">
              Health Over Wealth — Profile-based health and fitness planning for real-world consistency.
            </p>
            <p className="text-xs text-slate-500 dark:text-primary-100/60 mt-2">
              © {new Date().getFullYear()} HOW by Cosmics Software
            </p>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-[0.1em]">
              Resources
            </h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-600 dark:text-primary-100/80 hover:text-slate-900 dark:hover:text-primary-100 transition duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-[0.1em]">
              Legal
            </h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.slice(3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-600 dark:text-primary-100/80 hover:text-slate-900 dark:hover:text-primary-100 transition duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-200/30 dark:border-primary-300/20 pt-6">
          <p className="text-center text-xs text-slate-500 dark:text-primary-100/60">
            Build habits. Track progress. Live stronger.
          </p>
        </div>
      </div>
    </footer>
  );
}
