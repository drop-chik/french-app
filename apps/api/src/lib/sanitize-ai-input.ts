/**
 * Sanitiser for free-form user strings that feed into OpenAI system or
 * user prompts (conversation topic, writing topicHint, etc.).
 *
 * Defends against the basic prompt-injection attempts a curious user
 * might try: "ignore previous instructions", role-prompt overrides,
 * delimiter break-outs (```, ###, ---), and very long Unicode block
 * runs that crash tokenisers.
 *
 * This is not a perfect defence — adversarial users with effort can
 * still try — but it removes the cheap exploit and matches OpenAI
 * documented best-practice (validate + length-cap + escape delimiters).
 */
const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)\b/i,
  /\bdisregard\s+(all\s+)?(previous|prior|above)\b/i,
  /\b(forget|reset)\s+(everything|all)\s+(above|prior|previous)\b/i,
  /\byou\s+are\s+(now|actually|really)\s+(?:a|an|the|not)\s+\w+/i,
  /\bsystem\s*[:.]?\s*(prompt|message|role|override)\b/i,
  /\b(act|behave|respond)\s+as\s+(if\s+)?(?:a|an|the)\s+(?:different|new)\b/i,
  /<\s*\/?\s*(?:system|user|assistant)\s*>/i,
];

const DELIMITER_BREAKS = /[`]{3,}|[#]{3,}|[-]{4,}|[=]{4,}|\[\[\[|\]\]\]/g;

export function sanitizeUserPrompt(raw: string, maxLength = 200): string {
  if (typeof raw !== 'string') return '';
  let s = raw.trim().slice(0, maxLength);
  // Strip delimiter sequences that could escape from a quoted block in
  // our system-prompt assembly (we sometimes wrap user input in ```).
  s = s.replace(DELIMITER_BREAKS, ' ');
  // Collapse runaway whitespace / Unicode blanks.
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function isLikelyPromptInjection(raw: string): boolean {
  if (typeof raw !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some((re) => re.test(raw));
}

/**
 * Convenience: returns the safe string AND whether it looked like an
 * injection attempt. Caller can decide to log/refuse based on the flag.
 */
export function safePrompt(raw: string, maxLength = 200): { value: string; suspicious: boolean } {
  const value = sanitizeUserPrompt(raw, maxLength);
  return { value, suspicious: isLikelyPromptInjection(raw) };
}
