import type { AchievementBadge, AchievementCategory, AchievementTier } from "@/lib/achievement-badges";

type TrophyRoomProps = {
  badges: AchievementBadge[];
  category: AchievementCategory;
  onCategoryChange: (category: AchievementCategory) => void;
};

type TrophyBadgeSvgProps = {
  badgeId: string;
  tier: AchievementTier;
  isUnlocked: boolean;
};

function TrophyBadgeSvg({ badgeId, tier, isUnlocked }: TrophyBadgeSvgProps) {
  const key = badgeId.replace(/[^a-zA-Z0-9]/g, "");
  const grad = `${key}-grad`;
  const glow = `${key}-glow`;
  const lockGrad = `${key}-lock`;

  const unlockedTone =
    tier === "base"
      ? "text-sky-500 dark:text-emerald-300"
      : tier === "mid"
        ? "text-amber-500 dark:text-yellow-300"
        : "text-rose-500 dark:text-emerald-200";

  const toneClass = isUnlocked ? unlockedTone : "text-slate-400 dark:text-slate-600";

  return (
    <div className={`${toneClass} ${isUnlocked && tier === "elite" ? "motion-safe:animate-pulse" : ""}`}>
      <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true" role="img">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            {tier === "base" ? (
              <>
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" />
              </>
            ) : null}
            {tier === "mid" ? (
              <>
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#b45309" />
              </>
            ) : null}
            {tier === "elite" ? (
              <>
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="55%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </>
            ) : null}
          </linearGradient>
          <linearGradient id={lockGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={isUnlocked ? "#34d399" : "#64748b"} floodOpacity="0.55" />
          </filter>
        </defs>

        {tier === "base" ? (
          <g filter={`url(#${glow})`}>
            <polygon
              points="60,8 95,28 95,72 60,92 25,72 25,28"
              fill={isUnlocked ? `url(#${grad})` : `url(#${lockGrad})`}
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="60" cy="50" r="16" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="2" />
            <path d="M50 50l7 7 13-14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}

        {tier === "mid" ? (
          <g filter={`url(#${glow})`}>
            <path
              d="M60 8l23 9 9 23-9 23-23 9-23-9-9-23 9-23 23-9z"
              fill={isUnlocked ? `url(#${grad})` : `url(#${lockGrad})`}
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M24 49l-12 7 12 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M96 49l12 7-12 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="40" r="10" fill="rgba(255,255,255,0.2)" />
            <rect x="44" y="55" width="32" height="14" rx="6" fill="rgba(15,23,42,0.35)" />
          </g>
        ) : null}

        {tier === "elite" ? (
          <g filter={`url(#${glow})`}>
            <path
              d="M60 10l12 14h17l-7 17 13 12-18 5-6 18-11-13-11 13-6-18-18-5 13-12-7-17h17z"
              fill={isUnlocked ? `url(#${grad})` : `url(#${lockGrad})`}
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M38 36l8-10 14 10 14-10 8 10v13H38z" fill="rgba(15,23,42,0.3)" />
            <path d="M48 73l12-19 12 19-12 10z" fill="rgba(255,255,255,0.2)" />
            <circle cx="60" cy="44" r="6" fill="#f8fafc" opacity="0.9" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function categoryLabel(category: AchievementCategory) {
  if (category === "daily") {
    return "Daily Targets";
  }
  if (category === "weekly") {
    return "Weekly Targets";
  }
  return "Consistency Streaks";
}

function tierLabel(tier: AchievementTier) {
  if (tier === "base") {
    return "Base";
  }
  if (tier === "mid") {
    return "Mid";
  }
  return "Elite";
}

function formatValue(value: number, unit: string) {
  const rounded = Math.round(value);
  return unit ? `${rounded.toLocaleString()} ${unit}` : rounded.toLocaleString();
}

export function TrophyRoom({ badges, category, onCategoryChange }: TrophyRoomProps) {
  const visibleBadges = badges.filter((badge) => badge.category === category);
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30 lg:col-span-2 lg:col-start-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Trophy Room</h2>
          <p className="mt-1 text-xs text-slate-700 dark:text-primary-100/75">
            Unlock premium badges as you hit bigger milestones.
          </p>
        </div>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/50 dark:text-primary-100">
          Unlocked {unlockedCount}/{badges.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["daily", "weekly", "streak"] as AchievementCategory[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              category === item
                ? "bg-primary-600 text-white"
                : "border border-primary-300/50 bg-white text-slate-700 hover:bg-primary-50 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100 dark:hover:bg-primary-900/45"
            }`}
          >
            {categoryLabel(item)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleBadges.map((badge) => (
          <article
            key={badge.id}
            className={`rounded-xl border p-3 transition-all ${
              badge.unlocked
                ? "border-primary-300/50 bg-linear-to-br from-primary-50 to-white shadow-sm dark:border-primary-300/25 dark:from-primary-900/30 dark:to-primary-950/35"
                : "border-slate-300/70 bg-slate-100/80 dark:border-slate-600/50 dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <TrophyBadgeSvg badgeId={badge.id} tier={badge.tier} isUnlocked={badge.unlocked} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-primary-50">{badge.title}</p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:bg-primary-900/50 dark:text-primary-100/90">
                    {tierLabel(badge.tier)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-primary-100/75">{badge.description}</p>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-primary-100/70">
                  Target: {formatValue(badge.threshold, badge.unit)}
                </p>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-primary-200/15">
              <div
                className={`h-full rounded-full ${badge.unlocked ? "bg-[linear-gradient(90deg,#10b981,#0ea5e9,#f59e0b)]" : "bg-slate-400 dark:bg-slate-500"}`}
                style={{ width: `${badge.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-700 dark:text-primary-100/80">
              {badge.unlocked
                ? `Unlocked at ${formatValue(badge.current, badge.unit)}`
                : `${formatValue(badge.current, badge.unit)} current, ${formatValue(badge.remaining, badge.unit)} to go`}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
