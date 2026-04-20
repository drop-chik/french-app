interface Props {
  size?: number;
  className?: string | undefined;
}

/** Minimalist fox mascot — geometric flat style, orange + white + dark */
export function FoxLogo({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ears */}
      <polygon points="12,8 22,28 4,28" fill="#f97316" />
      <polygon points="52,8 42,28 60,28" fill="#f97316" />
      {/* Inner ears */}
      <polygon points="14,14 20,26 8,26" fill="#fdba74" />
      <polygon points="50,14 44,26 56,26" fill="#fdba74" />
      {/* Head */}
      <ellipse cx="32" cy="38" rx="22" ry="20" fill="#f97316" />
      {/* White face mask */}
      <ellipse cx="32" cy="44" rx="14" ry="14" fill="#ffffff" />
      {/* Eyes */}
      <circle cx="24" cy="35" r="3" fill="#1e293b" />
      <circle cx="40" cy="35" r="3" fill="#1e293b" />
      {/* Eye shine */}
      <circle cx="25" cy="34" r="1" fill="#ffffff" />
      <circle cx="41" cy="34" r="1" fill="#ffffff" />
      {/* Nose */}
      <ellipse cx="32" cy="42" rx="3" ry="2" fill="#1e293b" />
      {/* Mouth */}
      <path d="M29,45 Q32,48 35,45" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Hero fox — waving, full body */
export function FoxHero({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 280 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tail */}
      <path
        d="M60,260 Q20,220 40,180 Q55,160 70,180 Q85,200 70,240 Z"
        fill="#f97316"
      />
      <path
        d="M60,255 Q35,225 48,195 Q55,180 62,195 Q72,215 65,245 Z"
        fill="#fdba74"
      />

      {/* Body */}
      <ellipse cx="140" cy="240" rx="50" ry="60" fill="#f97316" />
      {/* Belly */}
      <ellipse cx="140" cy="250" rx="32" ry="40" fill="#ffffff" />

      {/* Left arm (down) */}
      <path
        d="M95,215 Q75,240 80,260"
        stroke="#f97316"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="80" cy="260" r="10" fill="#1e293b" />

      {/* Right arm (waving up) */}
      <path
        d="M185,215 Q210,190 220,160"
        stroke="#f97316"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="220" cy="160" r="10" fill="#1e293b" />

      {/* Legs */}
      <path d="M115,290 Q112,310 115,320" stroke="#f97316" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M165,290 Q168,310 165,320" stroke="#f97316" strokeWidth="16" strokeLinecap="round" fill="none" />
      <ellipse cx="115" cy="318" rx="12" ry="6" fill="#1e293b" />
      <ellipse cx="165" cy="318" rx="12" ry="6" fill="#1e293b" />

      {/* Head */}
      {/* Ears */}
      <polygon points="100,80 118,130 84,130" fill="#f97316" />
      <polygon points="180,80 162,130 196,130" fill="#f97316" />
      <polygon points="104,92 115,125 90,125" fill="#fdba74" />
      <polygon points="176,92 165,125 190,125" fill="#fdba74" />

      {/* Head shape */}
      <ellipse cx="140" cy="145" rx="48" ry="42" fill="#f97316" />
      {/* White face */}
      <ellipse cx="140" cy="155" rx="30" ry="30" fill="#ffffff" />

      {/* Eyes */}
      <circle cx="125" cy="140" r="6" fill="#1e293b" />
      <circle cx="155" cy="140" r="6" fill="#1e293b" />
      <circle cx="127" cy="138" r="2" fill="#ffffff" />
      <circle cx="157" cy="138" r="2" fill="#ffffff" />

      {/* Nose */}
      <ellipse cx="140" cy="152" rx="5" ry="3.5" fill="#1e293b" />

      {/* Happy mouth */}
      <path d="M132,158 Q140,166 148,158" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Sparkles around waving hand */}
      <g fill="#fbbf24">
        <polygon points="240,145 242,140 244,145 242,150" />
        <polygon points="230,140 232,135 234,140 232,145" />
        <polygon points="248,155 250,150 252,155 250,160" />
      </g>
    </svg>
  );
}

/** Small fox with accessory for journey steps */
export function FoxMini({ pose, className }: { pose: 'search' | 'read' | 'speak'; className?: string | undefined }) {
  const accessory = {
    search: (
      <>
        {/* Magnifying glass */}
        <circle cx="52" cy="28" r="8" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <line x1="57" y1="34" x2="62" y2="40" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    read: (
      <>
        {/* Book */}
        <rect x="44" y="30" width="18" height="14" rx="2" fill="#3b82f6" />
        <line x1="53" y1="30" x2="53" y2="44" stroke="#ffffff" strokeWidth="1.5" />
      </>
    ),
    speak: (
      <>
        {/* Speech bubbles */}
        <ellipse cx="54" cy="24" rx="10" ry="7" fill="#3b82f6" />
        <text x="49" y="27" fill="#ffffff" fontSize="8" fontWeight="bold">Ah</text>
        <circle cx="48" cy="32" r="2" fill="#3b82f6" />
        <circle cx="45" cy="36" r="1.5" fill="#3b82f6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Ears */}
      <polygon points="10,8 18,22 4,22" fill="#f97316" />
      <polygon points="38,8 30,22 44,22" fill="#f97316" />
      <polygon points="12,12 16,20 7,20" fill="#fdba74" />
      <polygon points="36,12 32,20 41,20" fill="#fdba74" />
      {/* Head */}
      <ellipse cx="24" cy="34" rx="18" ry="16" fill="#f97316" />
      {/* White face */}
      <ellipse cx="24" cy="38" rx="12" ry="12" fill="#ffffff" />
      {/* Eyes */}
      <circle cx="18" cy="32" r="2.5" fill="#1e293b" />
      <circle cx="30" cy="32" r="2.5" fill="#1e293b" />
      <circle cx="19" cy="31" r="0.8" fill="#ffffff" />
      <circle cx="31" cy="31" r="0.8" fill="#ffffff" />
      {/* Nose */}
      <ellipse cx="24" cy="37" rx="2.5" ry="1.8" fill="#1e293b" />
      {/* Mouth */}
      <path d="M21,40 Q24,43 27,40" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Accessory */}
      {accessory[pose]}
    </svg>
  );
}
