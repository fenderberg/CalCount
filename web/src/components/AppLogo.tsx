interface AppLogoProps {
  size?: number;
  wordmark?: boolean;
  className?: string;
}

export function AppLogo({ size = 48, wordmark = false, className = '' }: AppLogoProps) {
  const radius = Math.round(size * 0.27);
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label="CalCount">
      <span
        className="flex shrink-0 items-center justify-center bg-gradient-to-br from-budget-under-start to-budget-under-end shadow-logo"
        style={{ width: size, height: size, borderRadius: radius }}
        aria-hidden="true"
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="white"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray="132 57"
            transform="rotate(-58 50 50)"
          />
          <circle cx="50" cy="50" r="7.5" fill="rgba(255,255,255,.6)" />
        </svg>
      </span>
      {wordmark && (
        <span className="text-[27px] font-extrabold tracking-[-0.02em] text-ink">CalCount</span>
      )}
    </div>
  );
}
