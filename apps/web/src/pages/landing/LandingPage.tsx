import { useNavigate } from '@tanstack/react-router';
import {
  motion, useInView, useMotionValue, useSpring, useTransform, useScroll, animate,
} from 'framer-motion';
import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  Brain, Bot, BookOpen, Headphones, Layers, Zap, PenTool, Grid3X3,
  Ear, Type, ArrowRight, TrendingUp, MessageCircle, ChevronDown,
  Sparkles, CheckCircle, XCircle, RotateCcw, Flame, Trophy, Lock,
  Dumbbell, Check, Minus, X as XIcon,
} from 'lucide-react';
import { useI18n } from '../../shared/i18n';
import { useHeroVariant } from '../../shared/useHeroVariant';
import foxHero from './fox-hero.webp';
import foxIcon from './fox-icon.webp';
import styles from './LandingPage.module.css';
import confetti from 'canvas-confetti';
import { Preloader } from './Preloader';
import { OutcomeSection } from './OutcomeSection';
import { OnePlaceSection } from './OnePlaceSection';

/* ── Variants ── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const fadeIn  = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const staggerFast = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

/* ── SplitText ── */
function SplitText({ text }: { text: string }) {
  return (
    <span style={{ display: 'block' }}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Typewriter hook ── */
function useTypewriter(texts: string[], speed = 65) {
  const [state, setState] = useState({ displayed: '', textIdx: 0, charIdx: 0, deleting: false });
  useEffect(() => {
    const { textIdx, charIdx, deleting } = state;
    const current = texts[textIdx] ?? '';
    const delay = deleting ? speed / 2 : charIdx === current.length ? 2200 : speed;
    const t = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setState(s => ({ ...s, displayed: current.slice(0, charIdx + 1), charIdx: charIdx + 1 }));
      } else if (!deleting) {
        setState(s => ({ ...s, deleting: true }));
      } else if (charIdx > 0) {
        setState(s => ({ ...s, displayed: current.slice(0, charIdx - 1), charIdx: charIdx - 1 }));
      } else {
        setState(s => ({ ...s, deleting: false, textIdx: (textIdx + 1) % texts.length }));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [state, texts, speed]);
  return state.displayed;
}

/* ── CountUp ── */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const val = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => val.on('change', v => setDisplay(Math.round(v))), [val]);
  useEffect(() => { if (isInView) animate(val, to, { duration: 2.5, ease: 'easeOut' }); }, [isInView, val, to]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ── AnimatedSection ── */
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ── TiltCard: 3D rotation following the cursor inside the card.
   Used on every bento card — gives them the "alive" feel without being gaudy. */
function TiltCard({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 220, damping: 22 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/* ── MagneticButton: pulls itself toward the cursor when nearby.
   Subtle (max 8px translate). Wrapper for the big CTA buttons. */
function MagneticButton(props: {
  children: ReactNode;
  className?: string | undefined;
  onClick?: (() => void) | undefined;
  strength?: number | undefined;
}) {
  const { children, className, onClick, strength = 8 } = props;
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 18 });
  const sy = useSpring(y, { stiffness: 240, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set(((e.clientX - cx) / r.width) * strength * 2);
    y.set(((e.clientY - cy) / r.height) * strength * 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}

/* ── CompareCell: yes / partial / no marker for the comparison table. */
interface CompareLegend { yes: string; partial: string; no: string }
function CompareCell({ value, legend }: { value: string; legend: CompareLegend }) {
  if (value === 'yes') {
    return (
      <span className={`${styles.compareMark} ${styles.compareMarkYes}`}>
        <Check size={16} /> <span>{legend.yes}</span>
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className={`${styles.compareMark} ${styles.compareMarkPartial}`}>
        <Minus size={16} /> <span>{legend.partial}</span>
      </span>
    );
  }
  return (
    <span className={`${styles.compareMark} ${styles.compareMarkNo}`}>
      <XIcon size={16} /> <span>{legend.no}</span>
    </span>
  );
}

/* ── GlowCursor: soft radial glow that follows the mouse on the hero.
   Pure decoration. Skipped on touch devices (no mouse events fire). */
function GlowCursor() {
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);
  return <motion.div className={styles.glowCursor} style={{ x: sx, y: sy }} aria-hidden />;
}

/* ── Data ── */
const HERO_DOTS = [
  { size: 6, top: '14%', left: '7%',   delay: 0 },
  { size: 4, top: '28%', right: '9%',  delay: 0.6 },
  { size: 7, top: '62%', left: '11%',  delay: 1.3 },
  { size: 3, top: '80%', right: '5%',  delay: 0.9 },
  { size: 5, top: '44%', left: '3%',   delay: 1.9 },
  { size: 4, top: '19%', right: '21%', delay: 2.3 },
  { size: 3, top: '57%', right: '17%', delay: 0.4 },
  { size: 6, top: '88%', left: '28%',  delay: 1.6 },
];

const MARQUEE_WORDS = ['Bonjour', 'Merci', 'Au revoir', "S'il vous plaît", 'Amour', 'Liberté', 'Chat', 'Croissant', 'Magnifique', 'Bonne nuit'];
const DEMO_CARD_DATA = [
  { fr: 'Bonjour', emoji: '👋' },
  { fr: 'Merci',   emoji: '🙏' },
  { fr: 'Chat',    emoji: '🐱' },
];

const AI_TEXTS = [
  'Comment tu t\'appelles ?',
  'Je voudrais un café, s\'il vous plaît.',
  'Où est la bibliothèque ?',
  'Tu parles anglais ?',
];

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  // SavoirX-style A/B: negative-frame hero variant is opt-in via ?neg=1
  const heroVariant = useHeroVariant();
  const heroTitle    = heroVariant === 'neg' ? t.landing.heroAlt.title    : t.landing.hero.title;
  const heroSubtitle = heroVariant === 'neg' ? t.landing.heroAlt.subtitle : t.landing.hero.subtitle;

  const marqueeWords = (t.landing.marqueeWords as string[]);
  const demoCards = (t.landing.demoCards as Array<{ translation: string; hint: string }>);
  const MARQUEE_ITEMS = MARQUEE_WORDS.map((word, i) => ({ word, trans: marqueeWords[i] ?? word }));
  const DEMO_CARDS = DEMO_CARD_DATA.map((d, i) => ({ ...d, en: demoCards[i]?.translation ?? '', hint: demoCards[i]?.hint ?? '' }));
  const cmpLegend: CompareLegend = {
    yes: t.landing.compare.legendYes,
    partial: t.landing.compare.legendPartial,
    no: t.landing.compare.legendNo,
  };

  /* Preloader — only on first visit per session */
  const [showPreloader, setShowPreloader] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    if (sessionStorage.getItem('preloaderShown')) return false;
    sessionStorage.setItem('preloaderShown', '1');
    return true;
  });

  /* Nav — scroll-linked плавная анимация */
  const { scrollY } = useScroll();
  const navBg          = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']);
  const navShadow      = useTransform(scrollY, [0, 120], ['0px 0px 0px rgba(0,0,0,0)', '0px 4px 32px rgba(0,0,0,0.08)']);
  const navBorderColor = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.07)']);
  const navBlurOpacity = useTransform(scrollY, [0, 120], [0, 1]);
  const logoColor      = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0.95)', '#0f0f0f']);
  const loginColor     = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0.72)', '#6b6b6b']);
  const ctaBgColor     = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0.18)', 'rgba(37,99,235,1)']);
  const ctaBorderCol   = useTransform(scrollY, [0, 120], ['rgba(255,255,255,0.32)', 'rgba(37,99,235,0)']);

  /* Mouse parallax */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const foxX = useSpring(useTransform(mouseX, [-1, 1], [-20, 20]), { stiffness: 70, damping: 20 });
  const foxY = useSpring(useTransform(mouseY, [-1, 1], [-12, 12]), { stiffness: 70, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width * 2 - 1);
    mouseY.set((e.clientY - r.top) / r.height * 2 - 1);
  };

  /* Demo state */
  const [demoIdx, setDemoIdx]       = useState(0);
  const [demoFlipped, setDemoFlipped] = useState(false);
  const [demoScore, setDemoScore]   = useState({ knew: 0 });
  const [demoDone, setDemoDone]     = useState(false);

  const handleDemoAnswer = (knew: boolean) => {
    setDemoScore(s => ({ knew: s.knew + (knew ? 1 : 0) }));
    setDemoFlipped(false);
    if (demoIdx < DEMO_CARDS.length - 1) {
      setTimeout(() => setDemoIdx(i => i + 1), 350);
    } else {
      setTimeout(() => setDemoDone(true), 350);
    }
  };

  const resetDemo = () => {
    setDemoIdx(0); setDemoFlipped(false);
    setDemoScore({ knew: 0 }); setDemoDone(false);
  };

  /* Confetti + navigate */
  const goWithConfetti = () => {
    confetti({
      particleCount: 130, spread: 85,
      colors: ['#f97316', '#2563eb', '#7c3aed', '#ffffff', '#fbbf24'],
      origin: { y: 0.65 },
    });
    navigate({ to: '/login' });
  };

  const goLogin = () => navigate({ to: '/login' });

  /* Typewriter */
  const typedText = useTypewriter(AI_TEXTS);

  /* ── RENDER ── */
  return (
    <div className={styles.landing}>
      {showPreloader && <Preloader onDone={() => setShowPreloader(false)} />}

      {/* ═══ NAV ═══ */}
      <motion.nav
        className={styles.nav}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ backgroundColor: navBg, boxShadow: navShadow, borderBottomColor: navBorderColor }}
      >
        {/* Blur-слой — opacity привязан к скроллу */}
        <motion.div className={styles.navBlur} style={{ opacity: navBlurOpacity }} />

        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <img src={foxIcon} style={{ height: 32 }} width={32} height={32} alt="FrenchUp" />
            <motion.span className={styles.navLogoText} style={{ color: logoColor }}>
              FrenchUp
            </motion.span>
          </div>
          <div className={styles.navButtons}>
            <button className={styles.navLang} onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
              {lang === 'ru' ? 'EN' : 'RU'}
            </button>
            <motion.button className={styles.navLogin} onClick={goLogin} style={{ color: loginColor }}>
              {t.landing.nav.login}
            </motion.button>
            <motion.button
              className={styles.navCta}
              onClick={goWithConfetti}
              style={{ backgroundColor: ctaBgColor, borderColor: ctaBorderCol }}
            >
              {t.landing.nav.cta}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Wrap content in <main> so screen readers / Lighthouse find the
          primary landmark. The nav and footer are correctly outside. */}
      <main>

      {/* ═══ HERO ═══ */}
      <section className={styles.hero} onMouseMove={handleMouseMove}>
        <GlowCursor />
        {/* Animated orbs */}
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroOrb3} />

        {/* Sparkle dots */}
        {HERO_DOTS.map((dot, i) => (
          <motion.div
            key={i}
            className={styles.heroDot}
            style={Object.assign(
              { width: dot.size, height: dot.size, top: dot.top },
              dot.left ? { left: dot.left } : { right: (dot as any).right },
            )}
            animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.5, 0.7] }}
            transition={{ duration: 2.5 + dot.delay, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}

        <div className={styles.heroInner}>
          {/* Left */}
          <div className={styles.heroText}>
            <motion.div
              className={styles.heroBadge}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, type: 'spring', bounce: 0.5 }}
            >
              <Sparkles size={13} />
              <span>AI-powered French learning</span>
            </motion.div>

            <h1 className={styles.heroTitle}>
              <SplitText text={heroTitle} />
            </h1>

            <motion.p
              className={styles.heroSubtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              className={styles.heroActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <MagneticButton
                className={styles.heroCta}
                onClick={goWithConfetti}
                strength={12}
              >
                {t.landing.hero.cta} <ArrowRight size={20} />
              </MagneticButton>
              <p className={styles.heroNote}>{t.landing.hero.note}</p>
            </motion.div>
          </div>

          {/* Right — fox parallax */}
          <motion.div
            className={styles.heroIllustration}
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.heroGlow} />
            <div className={styles.heroGlowOrange} />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.img
                src={foxHero}
                className={styles.heroFox}
                alt="Fox mascot"
                style={{ x: foxX, y: foxY }}
                width={1024}
                height={1024}
                fetchPriority="high"
                decoding="async"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className={styles.scrollIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ OUTCOMES — SavoirX-style three-goals fork ═══ */}
      <OutcomeSection />

      {/* ═══ MARQUEE ═══ */}
      <div className={styles.marqueeSection} aria-hidden>
        <div className={styles.marqueeWrapper}>
          <div className={styles.marqueeTrack}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} className={styles.marqueeItem}>
                <span className={styles.marqueeFr}>🇫🇷 {item.word}</span>
                <span className={styles.marqueeArrow}>→</span>
                <span className={styles.marqueeRu}>{item.trans}</span>
                <span className={styles.marqueeSep}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <section className={styles.stats}>
        <AnimatedSection className={styles.statsInner}>
          {[
            { value: 17000, suffix: '+', label: t.landing.stats.wordsDb },
            { value: 10,    suffix: '+', label: t.landing.stats.modes },
            { value: 6,     suffix: '',  label: t.landing.stats.levels },
            { value: 110,   suffix: '+', label: t.landing.stats.satisfied },
          ].map((stat, i) => (
            <motion.div key={i} className={styles.statItem} variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className={styles.statValue}><CountUp to={stat.value} suffix={stat.suffix} /></div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ═══ BENTO FEATURES ═══ */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <AnimatedSection>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.features.title}
            </motion.h2>

            <motion.div className={styles.bentoGrid} variants={stagger}>

              {/* AI Chat — wide */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoChatCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><Bot size={20} /></span>
                    <span className={styles.bentoBadge}>AI</span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.aiChat}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.aiChatDesc}</p>
                  <div className={styles.chatPreview}>
                    <div className={styles.chatBubbleUser}>Bonjour ! Je m'appelle Anna.</div>
                    <div className={styles.chatBubbleAi}>
                      <span>{typedText}</span>
                      <span className={styles.cursor}>|</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Flashcard flip */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoFlipCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><Brain size={20} /></span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.cards}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.cardsDesc}</p>
                  <div className={styles.flipCard}>
                    <div className={styles.flipCardInner}>
                      <div className={styles.flipCardFront}>
                        <div className={styles.flipWord}>Chat</div>
                        <div className={styles.flipHint}>{t.landing.flipHint}</div>
                      </div>
                      <div className={styles.flipCardBack}>
                        <div className={styles.flipEmoji}>🐱</div>
                        <div className={styles.flipAnswer}>{t.landing.flipAnswer}</div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Grammar */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoGrammarCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><BookOpen size={20} /></span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.grammar}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.grammarDesc}</p>
                  <div className={styles.grammarTable}>
                    {[['Je', 'suis'], ['Tu', 'es'], ['Il/Elle', 'est']].map(([pro, v]) => (
                      <div key={pro} className={styles.grammarRow}>
                        <span className={styles.grammarPro}>{pro}</span>
                        <span className={styles.grammarVerb}>{v}</span>
                      </div>
                    ))}
                  </div>
                </TiltCard>
              </motion.div>

              {/* Listening / Sound wave */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoListenCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><Headphones size={20} /></span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.listening}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.listeningDesc}</p>
                  <div className={styles.soundWave}>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={styles.soundBar}
                        animate={{ scaleY: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.7 + i * 0.06, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </TiltCard>
              </motion.div>

              {/* Conjugation */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoConjCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><Type size={20} /></span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.conjugation}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.conjugationDesc}</p>
                  <div className={styles.conjPreview}>
                    <div className={styles.conjVerb}>être</div>
                    <div className={styles.conjRows}>
                      <div><span className={styles.conjPro}>je</span> <span className={styles.conjForm}>suis</span></div>
                      <div><span className={styles.conjPro}>tu</span> <span className={styles.conjForm}>es</span></div>
                      <div><span className={styles.conjPro}>il/elle</span> <span className={styles.conjForm}>est</span></div>
                      <div><span className={styles.conjPro}>nous</span> <span className={styles.conjForm}>sommes</span></div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Drills */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <TiltCard className={`${styles.bentoCard} ${styles.bentoDrillsCard}`}>
                  <div className={styles.bentoCardHeader}>
                    <span className={styles.bentoIcon}><Dumbbell size={20} /></span>
                    <span className={styles.bentoBadge}>∞</span>
                  </div>
                  <h3 className={styles.bentoTitle}>{t.landing.features.drills}</h3>
                  <p className={styles.bentoDesc}>{t.landing.features.drillsDesc}</p>
                  <div className={styles.drillsPreview}>
                    <div className={styles.drillsLine}>J'__ allé au marché.</div>
                    <div className={styles.drillsOptions}>
                      <span className={styles.drillsOpt}>ai</span>
                      <span className={`${styles.drillsOpt} ${styles.drillsOptOk}`}>suis</span>
                      <span className={styles.drillsOpt}>es</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ LIVE DEMO ═══ */}
      <section className={styles.demo}>
        <div className={styles.demoInner}>
          <AnimatedSection>
            <motion.div className={styles.demoLabel} variants={fadeIn}>
              <img src={foxIcon} style={{ height: 26 }} width={26} height={26} alt="" />
              <span>{t.landing.demo.tryNow}</span>
            </motion.div>

            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.demo.title}
            </motion.h2>

            {!demoDone ? (
              <motion.div className={styles.demoCardWrap} variants={fadeUp}>
                {/* Progress dots */}
                <div className={styles.demoProgress}>
                  {DEMO_CARDS.map((_, i) => (
                    <div key={i} className={`${styles.demoDot} ${i <= demoIdx ? styles.demoDotActive : ''}`} />
                  ))}
                </div>

                {/* Flip card */}
                {(() => {
                  const card = DEMO_CARDS[demoIdx] ?? DEMO_CARDS[0]!;
                  return (
                    <div
                      className={`${styles.demoFlip} ${demoFlipped ? styles.demoFlipped : ''}`}
                      onClick={() => setDemoFlipped(f => !f)}
                    >
                      <div className={styles.demoFlipInner}>
                        <div className={styles.demoFlipFront}>
                          <div className={styles.demoHint}>{card.hint}</div>
                          <div className={styles.demoWord}>{card.fr}</div>
                          <div className={styles.demoTapHint}>{t.landing.demo.tapHint}</div>
                        </div>
                        <div className={styles.demoFlipBack}>
                          <div className={styles.demoEmoji}>{card.emoji}</div>
                          <div className={styles.demoAnswer}>{card.en}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Answer buttons */}
                {demoFlipped && (
                  <motion.div
                    className={styles.demoActions}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button className={styles.demoBtnWrong} onClick={() => handleDemoAnswer(false)}>
                      <XCircle size={17} /> {t.landing.demo.didntKnow}
                    </button>
                    <button className={styles.demoBtnRight} onClick={() => handleDemoAnswer(true)}>
                      <CheckCircle size={17} /> {t.landing.demo.knew}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                className={styles.demoDone}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.45 }}
              >
                <div className={styles.demoDoneEmoji}>🎉</div>
                <h3 className={styles.demoDoneTitle}>
                  {String(t.landing.demo.result).replace('{knew}', String(demoScore.knew)).replace('{total}', String(DEMO_CARDS.length))}
                </h3>
                <p className={styles.demoDoneText}>{t.landing.demo.cta2}</p>
                <div className={styles.demoDoneActions}>
                  <motion.button
                    className={styles.heroCta}
                    onClick={goWithConfetti}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t.landing.demo.startFree} <ArrowRight size={18} />
                  </motion.button>
                  <button className={styles.demoRestart} onClick={resetDemo}>
                    <RotateCcw size={15} /> {t.landing.demo.retry}
                  </button>
                </div>
                <p className={styles.heroNote} style={{ marginTop: 12 }}>
                  {t.landing.microcopy.noCardEver}
                </p>
              </motion.div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ JOURNEY ═══ */}
      <section className={styles.journey}>
        <div className={styles.journeyInner}>
          <AnimatedSection>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.journey.title}
            </motion.h2>
            <motion.div className={styles.journeySteps} variants={stagger}>
              {[
                { num: 1, Icon: BookOpen,       title: t.landing.journey.step1, desc: t.landing.journey.step1desc },
                { num: 2, Icon: Brain,          title: t.landing.journey.step2, desc: t.landing.journey.step2desc },
                { num: 3, Icon: MessageCircle,  title: t.landing.journey.step3, desc: t.landing.journey.step3desc },
              ].map(s => (
                <motion.div key={s.num} className={styles.step} variants={fadeUp} transition={{ duration: 0.5 }}>
                  <motion.div className={styles.stepNumber} whileHover={{ scale: 1.12, rotate: 6 }}>
                    {s.num}
                  </motion.div>
                  <div className={styles.stepIcon}><s.Icon size={28} strokeWidth={1.8} /></div>
                  <div>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepDesc}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ 8 MODES ═══ */}
      <section className={styles.modes}>
        <div className={styles.modesInner}>
          <AnimatedSection>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.modes.title}
            </motion.h2>
            <motion.div className={styles.modesGrid} variants={staggerFast}>
              {[
                { icon: <Layers size={24} />,   name: t.landing.modes.flashcard },
                { icon: <Grid3X3 size={24} />,  name: t.landing.modes.multipleChoice },
                { icon: <PenTool size={24} />,  name: t.landing.modes.spelling },
                { icon: <Zap size={24} />,      name: t.landing.modes.matching },
                { icon: <Type size={24} />,     name: t.landing.modes.fillBlank },
                { icon: <Ear size={24} />,      name: t.landing.modes.listening },
                { icon: <Zap size={24} />,      name: t.landing.modes.speedRound },
                { icon: <BookOpen size={24} />, name: t.landing.modes.context },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  className={styles.modeCard}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <span className={styles.modeIcon}>{m.icon}</span>
                  <span className={styles.modeName}>{m.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ CEFR PATH ═══ */}
      <section className={styles.cefr}>
        <div className={styles.cefrInner}>
          <AnimatedSection>
            <motion.div className={styles.sectionLabel} variants={fadeIn}>{t.landing.cefrPath.label}</motion.div>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.cefrPath.title}
            </motion.h2>
            <motion.p className={styles.sectionLead} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.cefrPath.subtitle}
            </motion.p>

            <motion.div className={styles.cefrTrack} variants={stagger}>
              <div className={styles.cefrLine} />
              {(t.landing.cefrPath.levels as Array<{ code: string; name: string; desc: string; duration: string }>).map((lvl, i) => (
                <motion.div
                  key={lvl.code}
                  className={`${styles.cefrNode} ${styles[`cefrNode${lvl.code}`] ?? ''}`}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  <div className={styles.cefrBadge}>{lvl.code}</div>
                  <div className={styles.cefrBody}>
                    {/* h3 (not h4) — siblings in this section's hierarchy
                        are h3-level. PSI flagged h2→h4 jump as a heading
                        order violation. Visual styling lives on .cefrName,
                        so only the tag changes. */}
                    <h3 className={styles.cefrName}>{lvl.name}</h3>
                    <p className={styles.cefrDesc}>{lvl.desc}</p>
                    <span className={styles.cefrDuration}>{lvl.duration}</span>
                  </div>
                  {i < 5 && <div className={styles.cefrArrow}>→</div>}
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ STREAK HOOK ═══ */}
      <section className={styles.streak}>
        <div className={styles.streakInner}>
          <AnimatedSection>
            <div className={styles.streakLayout}>
              <motion.div className={styles.streakLeft} variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className={styles.sectionLabel}>{t.landing.streak.label}</div>
                <h2 className={styles.sectionTitle}>{t.landing.streak.title}</h2>
                <p className={styles.sectionLead}>{t.landing.streak.subtitle}</p>

                <ul className={styles.streakBullets}>
                  {[
                    { title: t.landing.streak.bullet1, desc: t.landing.streak.bullet1desc, icon: <Flame size={18} /> },
                    { title: t.landing.streak.bullet2, desc: t.landing.streak.bullet2desc, icon: <Trophy size={18} /> },
                    { title: t.landing.streak.bullet3, desc: t.landing.streak.bullet3desc, icon: <RotateCcw size={18} /> },
                  ].map((b, i) => (
                    <li key={i} className={styles.streakBullet}>
                      <span className={styles.streakBulletIcon}>{b.icon}</span>
                      <div>
                        <div className={styles.streakBulletTitle}>{b.title}</div>
                        <div className={styles.streakBulletDesc}>{b.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className={styles.streakRight}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                <div className={styles.streakFlameWrap}>
                  <motion.div
                    className={styles.streakFlameOuter}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className={styles.streakFlame}
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🔥
                  </motion.div>
                </div>
                <div className={styles.streakNumber}>
                  <CountUp to={147} />
                </div>
                <div className={styles.streakLabel}>day streak</div>
                <div className={styles.streakWeek}>
                  {[true, true, true, true, true, true, false].map((on, i) => (
                    <div key={i} className={`${styles.streakDay} ${on ? styles.streakDayOn : ''}`} />
                  ))}
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ ACHIEVEMENTS ═══ */}
      <section className={styles.achievements}>
        <div className={styles.achievementsInner}>
          <AnimatedSection>
            <motion.div className={styles.sectionLabel} variants={fadeIn}>{t.landing.achievements.label}</motion.div>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.achievements.title}
            </motion.h2>
            <motion.p className={styles.sectionLead} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.achievements.subtitle}
            </motion.p>

            <motion.div className={styles.achievementsGrid} variants={stagger}>
              {(t.landing.achievements.list as Array<{ icon: string; title: string; desc: string; rarity: string }>).map((a, i) => {
                const locked = i >= 4;
                return (
                  <motion.div
                    key={i}
                    className={`${styles.achBadge} ${styles[`achRarity_${a.rarity}`] ?? ''} ${locked ? styles.achBadgeLocked : ''}`}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -4, scale: 1.03 }}
                  >
                    <div className={styles.achIconWrap}>
                      <span className={styles.achIcon}>{a.icon}</span>
                      {locked && <Lock size={14} className={styles.achLock} />}
                    </div>
                    <div className={styles.achInfo}>
                      <div className={styles.achTitle}>{a.title}</div>
                      <div className={styles.achDesc}>{a.desc}</div>
                    </div>
                    <div className={styles.achRarityTag}>
                      {a.rarity === 'bronze'    && t.landing.achievements.rarityBronze}
                      {a.rarity === 'silver'    && t.landing.achievements.raritySilver}
                      {a.rarity === 'gold'      && t.landing.achievements.rarityGold}
                      {a.rarity === 'legendary' && t.landing.achievements.rarityLegendary}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className={styles.compare}>
        <div className={styles.compareInner}>
          <AnimatedSection>
            <motion.div className={styles.sectionLabel} variants={fadeIn}>{t.landing.compare.label}</motion.div>
            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.compare.title}
            </motion.h2>
            <motion.p className={styles.sectionLead} variants={fadeUp} transition={{ duration: 0.5 }}>
              {t.landing.compare.subtitle}
            </motion.p>

            <motion.div className={styles.compareTableWrap} variants={fadeUp} transition={{ duration: 0.5 }}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.compareFeatureCol}></th>
                    {(t.landing.compare.columns as string[]).map((col, i) => (
                      <th key={col} className={i === 0 ? styles.compareUsCol : styles.compareThemCol}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(t.landing.compare.rows as Array<{ feature: string; frenchup: string; duolingo: string; babbel: string }>).map((row, i) => (
                    <tr key={i}>
                      <td className={styles.compareFeature}>{row.feature}</td>
                      <td className={styles.compareUsCell}><CompareCell value={row.frenchup} legend={cmpLegend} /></td>
                      <td className={styles.compareThemCell}><CompareCell value={row.duolingo} legend={cmpLegend} /></td>
                      <td className={styles.compareThemCell}><CompareCell value={row.babbel} legend={cmpLegend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ ONE PLACE — anti-fragmentation pitch ═══ */}
      <OnePlaceSection />

      {/* ═══ CTA BLOCK ═══ */}
      <section className={styles.ctaBlock}>
        <AnimatedSection className={styles.ctaInner}>
          <motion.div variants={fadeUp}>
            <motion.img
              src={foxHero}
              className={styles.ctaFox}
              alt="Fox mascot"
              width={1024}
              height={1024}
              loading="lazy"
              decoding="async"
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <motion.h2 className={styles.ctaTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
            {t.landing.cta.title}
          </motion.h2>
          <motion.p className={styles.ctaSubtitle} variants={fadeUp} transition={{ duration: 0.5 }}>
            {t.landing.cta.subtitle}
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <MagneticButton
              className={styles.ctaButton}
              onClick={goWithConfetti}
              strength={14}
            >
              {t.landing.cta.button}
            </MagneticButton>
            <p className={styles.ctaMicrocopy}>{t.landing.microcopy.noCardEver}</p>
          </motion.div>
        </AnimatedSection>
      </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <img src={foxIcon} style={{ height: 22 }} width={22} height={22} alt="FrenchUp" />
            <span className={styles.footerLogo}>FrenchUp</span>
            <span className={styles.footerCopy}>{t.landing.footer.copy.replace('{year}', String(new Date().getFullYear()))}</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="/login" className={styles.footerLink}>{t.landing.nav.login}</a>
            <a href="/terms" className={styles.footerLink}>{t.landing.footer.terms}</a>
            <a href="/privacy" className={styles.footerLink}>{t.landing.footer.privacy}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
