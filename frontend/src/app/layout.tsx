import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "next-themes";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://how.cosmics.software"),
  title: {
    default: "HOW | Health Over Wealth",
    template: "%s | HOW",
  },
  description:
    "HOW is a health and fitness platform for profile planning, nutrition analytics, activity insights, progress tracking, and practical calculators.",
  applicationName: "HOW | Health Over Wealth",
  category: "health and fitness",
  keywords: [
    "health over wealth",
    "how cosmics",
    "health fitness app",
    "fitness tracker",
    "steps tracker",
    "fitness planner",
    "nutrition calculator",
    "macro calculator",
    "activity tracker",
    "bmi bmr tdee",
    "micro nutrient targets",
    "google fit integration",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "HOW | Health Over Wealth",
    description:
      "Build your profile, track fitness metrics, compare progress, and get personalized health guidance.",
    type: "website",
    url: "https://how.cosmics.software",
    siteName: "Health Over Wealth",
    images: [
      {
        url: "/images/howlogo.png",
        width: 512,
        height: 512,
        alt: "HOW logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HOW | Health Over Wealth",
    description:
      "Health and fitness planning with profile insights, nutrition intelligence, and progress tracking.",
    images: ["/images/howlogo.png"],
  },
  alternates: {
    canonical: "https://how.cosmics.software",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/images/howlogo.png", type: "image/png", sizes: "32x32" },
      { url: "/images/howlogo.png", type: "image/png", sizes: "192x192" },
      { url: "/images/howlogo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/images/howlogo.png",
    apple: [{ url: "/images/howlogo.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${heading.variable} ${body.variable} h-full antialiased scroll-smooth`}
    >
      <body suppressHydrationWarning className="min-h-full bg-white text-slate-900 dark:bg-[#000a07] dark:text-white transition-colors duration-300">
        <Script id="strip-bis-skin-checked" strategy="beforeInteractive">
          {`(() => {
  const attr = "bis_skin_checked";
  const selector = "[" + attr + "]";

  const strip = (root) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(selector).forEach((node) => node.removeAttribute(attr));
  };

  strip(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === attr && mutation.target && mutation.target.removeAttribute) {
        mutation.target.removeAttribute(attr);
      }

      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (!node || node.nodeType !== 1) return;
          if (node.hasAttribute && node.hasAttribute(attr)) {
            node.removeAttribute(attr);
          }
          strip(node);
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [attr],
  });

  window.addEventListener(
    "load",
    () => {
      setTimeout(() => observer.disconnect(), 1500);
    },
    { once: true }
  );
})();`}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="how-theme">
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
