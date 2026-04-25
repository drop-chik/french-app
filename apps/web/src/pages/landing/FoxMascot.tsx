interface Props {
  size?: number;
  className?: string | undefined;
}

/** Polished fox logo — gradient style with depth */
export function FoxLogo({ size = 32, className }: Props) {
  const id = 'fox-logo';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`${id}-ear`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fef3c7" />
        </radialGradient>
      </defs>

      {/* Ears */}
      <path d="M10,6 L22,26 Q17,28 6,26 Z" fill={`url(#${id}-fur)`} />
      <path d="M54,6 L42,26 Q47,28 58,26 Z" fill={`url(#${id}-fur)`} />
      {/* Inner ears */}
      <path d="M14,13 L20,24 Q17,25 10,24 Z" fill={`url(#${id}-ear)`} />
      <path d="M50,13 L44,24 Q47,25 54,24 Z" fill={`url(#${id}-ear)`} />

      {/* Head */}
      <ellipse cx="32" cy="37" rx="23" ry="21" fill={`url(#${id}-fur)`} />
      {/* White face mask */}
      <path d="M19,38 Q32,28 45,38 Q44,54 32,56 Q20,54 19,38 Z" fill={`url(#${id}-face)`} />

      {/* Eyes */}
      <ellipse cx="24" cy="35" rx="3.2" ry="3.5" fill="#1e1b2e" />
      <ellipse cx="40" cy="35" rx="3.2" ry="3.5" fill="#1e1b2e" />
      {/* Eye shine */}
      <circle cx="25.5" cy="33.5" r="1.3" fill="#ffffff" opacity="0.9" />
      <circle cx="41.5" cy="33.5" r="1.3" fill="#ffffff" opacity="0.9" />
      <circle cx="23" cy="36" r="0.6" fill="#ffffff" opacity="0.5" />
      <circle cx="39" cy="36" r="0.6" fill="#ffffff" opacity="0.5" />

      {/* Nose */}
      <ellipse cx="32" cy="43" rx="3.5" ry="2.5" fill="#1e1b2e" />
      <ellipse cx="31.5" cy="42.2" rx="1.2" ry="0.7" fill="#ffffff" opacity="0.25" />

      {/* Mouth */}
      <path d="M29,46 Q32,49 35,46" stroke="#1e1b2e" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <circle cx="18" cy="42" r="3.5" fill="#fb923c" opacity="0.25" />
      <circle cx="46" cy="42" r="3.5" fill="#fb923c" opacity="0.25" />
    </svg>
  );
}

/** Hero fox — full body, waving, with beret & scarf */
export function FoxHero({ className }: { className?: string | undefined }) {
  const id = 'fox-hero';
  return (
    <svg
      viewBox="0 0 300 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`${id}-fur2`} x1="0.2" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.5" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fef9ee" />
        </radialGradient>
        <radialGradient id={`${id}-belly`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fef3c7" />
        </radialGradient>
        <linearGradient id={`${id}-beret`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${id}-scarf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter={`url(#${id}-shadow)`}>
        {/* Tail */}
        <path
          d="M55,270 Q10,230 30,180 Q45,155 65,175 Q80,195 65,245 Z"
          fill={`url(#${id}-fur)`}
        />
        <path
          d="M58,262 Q28,232 42,195 Q50,178 58,192 Q68,215 62,250 Z"
          fill={`url(#${id}-fur2)`}
        />
        {/* Tail tip */}
        <path
          d="M30,180 Q20,165 28,155 Q36,150 38,162 Q42,170 35,178 Z"
          fill="#ffffff"
          opacity="0.9"
        />

        {/* Body */}
        <ellipse cx="150" cy="255" rx="55" ry="65" fill={`url(#${id}-fur)`} />
        {/* Belly */}
        <ellipse cx="150" cy="268" rx="36" ry="44" fill={`url(#${id}-belly)`} />

        {/* Left arm (down, relaxed) */}
        <path
          d="M100,228 Q78,252 82,275"
          stroke={`url(#${id}-fur)`}
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="82" cy="276" rx="11" ry="9" fill="#1e1b2e" />

        {/* Right arm (waving up) */}
        <path
          d="M200,228 Q225,200 235,168"
          stroke={`url(#${id}-fur)`}
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="236" cy="166" rx="11" ry="9" fill="#1e1b2e" />

        {/* Legs */}
        <path d="M125,305 Q120,330 124,345" stroke={`url(#${id}-fur)`} strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M175,305 Q180,330 176,345" stroke={`url(#${id}-fur)`} strokeWidth="18" strokeLinecap="round" fill="none" />
        <ellipse cx="124" cy="347" rx="14" ry="7" fill="#1e1b2e" />
        <ellipse cx="176" cy="347" rx="14" ry="7" fill="#1e1b2e" />

        {/* Head */}
        {/* Ears */}
        <path d="M105,88 L122,138 Q112,142 88,138 Z" fill={`url(#${id}-fur)`} />
        <path d="M195,88 L178,138 Q188,142 212,138 Z" fill={`url(#${id}-fur)`} />
        <path d="M110,100 L119,132 Q113,134 96,132 Z" fill={`url(#${id}-fur2)`} />
        <path d="M190,100 L181,132 Q187,134 204,132 Z" fill={`url(#${id}-fur2)`} />

        {/* Head shape */}
        <ellipse cx="150" cy="155" rx="52" ry="46" fill={`url(#${id}-fur)`} />

        {/* White face mask — shaped like a V dropping down */}
        <path d="M108,155 Q150,130 192,155 Q190,192 150,198 Q110,192 108,155 Z" fill={`url(#${id}-face)`} />

        {/* Beret */}
        <ellipse cx="150" cy="112" rx="38" ry="12" fill={`url(#${id}-beret)`} />
        <path d="M118,112 Q125,88 155,85 Q175,86 182,112 Z" fill={`url(#${id}-beret)`} />
        <circle cx="150" cy="82" r="5" fill={`url(#${id}-beret)`} />
        {/* Beret highlight */}
        <path d="M130,98 Q145,90 160,94" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Eyes — expressive */}
        <ellipse cx="132" cy="148" rx="7" ry="8" fill="#1e1b2e" />
        <ellipse cx="168" cy="148" rx="7" ry="8" fill="#1e1b2e" />
        {/* Eye shine — large */}
        <circle cx="135" cy="145" r="3" fill="#ffffff" opacity="0.9" />
        <circle cx="171" cy="145" r="3" fill="#ffffff" opacity="0.9" />
        {/* Eye shine — small */}
        <circle cx="130" cy="150" r="1.2" fill="#ffffff" opacity="0.5" />
        <circle cx="166" cy="150" r="1.2" fill="#ffffff" opacity="0.5" />

        {/* Eyebrows — friendly raised */}
        <path d="M122,136 Q128,131 138,133" stroke="#1e1b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M162,133 Q172,131 178,136" stroke="#1e1b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="150" cy="165" rx="6" ry="4.5" fill="#1e1b2e" />
        <ellipse cx="149" cy="163.5" rx="2" ry="1" fill="#ffffff" opacity="0.25" />

        {/* Happy mouth */}
        <path d="M140,173 Q150,182 160,173" stroke="#1e1b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Cheek blush */}
        <ellipse cx="113" cy="165" rx="8" ry="5" fill="#fb923c" opacity="0.3" />
        <ellipse cx="187" cy="165" rx="8" ry="5" fill="#fb923c" opacity="0.3" />

        {/* Whiskers */}
        <line x1="100" y1="160" x2="120" y2="163" stroke="#d4a574" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        <line x1="98" y1="168" x2="118" y2="168" stroke="#d4a574" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        <line x1="180" y1="163" x2="200" y2="160" stroke="#d4a574" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        <line x1="182" y1="168" x2="202" y2="168" stroke="#d4a574" strokeWidth="1" opacity="0.4" strokeLinecap="round" />

        {/* Scarf */}
        <path d="M108,192 Q150,205 192,192 Q195,210 192,215 Q150,225 108,215 Q105,210 108,192 Z" fill={`url(#${id}-scarf)`} />
        <path d="M150,215 Q155,240 148,260 Q144,265 140,258 Q138,240 145,218" fill={`url(#${id}-scarf)`} />
        {/* Scarf stripe */}
        <path d="M112,200 Q150,212 188,200" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M114,208 Q150,218 186,208" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.5" />

        {/* Sparkles around waving hand */}
        <g fill="#fbbf24" opacity="0.8">
          <path d="M252,150 L254,142 L256,150 L254,158 Z" />
          <path d="M244,138 L246,132 L248,138 L246,144 Z" />
          <path d="M260,162 L262,156 L264,162 L262,168 Z" />
        </g>
        {/* Small sparkle dots */}
        <circle cx="240" cy="155" r="2" fill="#fbbf24" opacity="0.6" />
        <circle cx="268" cy="148" r="1.5" fill="#fbbf24" opacity="0.4" />
      </g>
    </svg>
  );
}

/** Small fox with accessory for journey steps */
export function FoxMini({ pose, className }: { pose: 'search' | 'read' | 'speak'; className?: string | undefined }) {
  const id = `fox-mini-${pose}`;

  const accessory = {
    search: (
      <>
        {/* Magnifying glass */}
        <circle cx="56" cy="24" r="9" stroke="#6366f1" strokeWidth="2.5" fill="rgba(99,102,241,0.08)" />
        <line x1="62" y1="31" x2="68" y2="38" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        {/* Lens flare */}
        <path d="M52,20 Q54,18 56,20" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
      </>
    ),
    read: (
      <>
        {/* Open book */}
        <path d="M46,28 Q54,24 62,28 L62,44 Q54,40 46,44 Z" fill="#6366f1" />
        <path d="M54,24 L54,42" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
        {/* Pages */}
        <line x1="48" y1="32" x2="53" y2="31" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        <line x1="48" y1="35" x2="53" y2="34" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        <line x1="55" y1="31" x2="60" y2="32" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        <line x1="55" y1="34" x2="60" y2="35" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
      </>
    ),
    speak: (
      <>
        {/* Speech bubble with Bonjour */}
        <rect x="44" y="14" width="26" height="18" rx="8" fill="#6366f1" />
        <polygon points="48,32 52,32 46,37" fill="#6366f1" />
        <text x="50" y="26" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="system-ui">Oui!</text>
        {/* Sound waves */}
        <path d="M72,20 Q76,23 72,26" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M75,17 Q80,23 75,29" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 82 58" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fef9ee" />
        </radialGradient>
      </defs>

      {/* Ears */}
      <path d="M8,6 L18,20 Q14,22 4,20 Z" fill={`url(#${id}-fur)`} />
      <path d="M38,6 L28,20 Q32,22 42,20 Z" fill={`url(#${id}-fur)`} />
      <path d="M11,11 L16,19 Q14,20 8,19 Z" fill="#fdba74" />
      <path d="M35,11 L30,19 Q32,20 38,19 Z" fill="#fdba74" />

      {/* Head */}
      <ellipse cx="23" cy="32" rx="19" ry="17" fill={`url(#${id}-fur)`} />

      {/* White face mask */}
      <path d="M10,33 Q23,25 36,33 Q35,46 23,48 Q11,46 10,33 Z" fill={`url(#${id}-face)`} />

      {/* Eyes */}
      <ellipse cx="17" cy="30" rx="2.8" ry="3" fill="#1e1b2e" />
      <ellipse cx="29" cy="30" rx="2.8" ry="3" fill="#1e1b2e" />
      <circle cx="18.2" cy="28.8" r="1.1" fill="#ffffff" opacity="0.9" />
      <circle cx="30.2" cy="28.8" r="1.1" fill="#ffffff" opacity="0.9" />

      {/* Nose */}
      <ellipse cx="23" cy="36" rx="2.8" ry="2" fill="#1e1b2e" />
      <ellipse cx="22.5" cy="35.3" rx="1" ry="0.5" fill="#ffffff" opacity="0.25" />

      {/* Mouth */}
      <path d="M20,39 Q23,42 26,39" stroke="#1e1b2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <circle cx="10" cy="36" r="3" fill="#fb923c" opacity="0.2" />
      <circle cx="36" cy="36" r="3" fill="#fb923c" opacity="0.2" />

      {/* Accessory */}
      {accessory[pose]}
    </svg>
  );
}
