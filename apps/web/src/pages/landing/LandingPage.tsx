import { useNavigate } from '@tanstack/react-router';
import {
  motion, useInView, useMotionValue, useSpring, useTransform, useScroll, animate,
} from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Brain, Bot, BookOpen, Headphones, Layers, Zap, PenTool, Grid3X3,
  Ear, Type, ArrowRight, TrendingUp, MessageCircle, ChevronDown,
  Sparkles, CheckCircle, XCircle, RotateCcw,
} from 'lucide-react';
import { useI18n } from '../../shared/i18n';
import foxHero from './fox-hero.png';
import foxIcon from './fox-icon.png';
import styles from './LandingPage.module.css';
import confetti from 'canvas-confetti';
import { Preloader } from './Preloader';

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

const MARQUEE_ITEMS = [
  { word: 'Bonjour',          trans: 'Привет' },
  { word: 'Merci',            trans: 'Спасибо' },
  { word: 'Au revoir',        trans: 'До свидания' },
  { word: "S'il vous plaît",  trans: 'Пожалуйста' },
  { word: 'Amour',            trans: 'Любовь' },
  { word: 'Liberté',          trans: 'Свобода' },
  { word: 'Chat',             trans: 'Кошка' },
  { word: 'Croissant',        trans: 'Круассан' },
  { word: 'Magnifique',       trans: 'Великолепно' },
  { word: 'Bonne nuit',       trans: 'Спокойной ночи' },
];

const DEMO_CARDS = [
  { fr: 'Bonjour',    en: 'Привет',         emoji: '👋', hint: 'Приветствие' },
  { fr: 'Merci',      en: 'Спасибо',        emoji: '🙏', hint: 'Благодарность' },
  { fr: 'Chat',       en: 'Кошка',          emoji: '🐱', hint: 'Животное' },
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
  const { t } = useI18n();
  const navigate = useNavigate();

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
            <img src={foxIcon} style={{ height: 32 }} alt="FrenchUp" />
            <motion.span className={styles.navLogoText} style={{ color: logoColor }}>
              FrenchUp
            </motion.span>
          </div>
          <div className={styles.navButtons}>
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

      {/* ═══ HERO ═══ */}
      <section className={styles.hero} onMouseMove={handleMouseMove}>
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
              <SplitText text={t.landing.hero.title} />
            </h1>

            <motion.p
              className={styles.heroSubtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              {t.landing.hero.subtitle}
            </motion.p>

            <motion.div
              className={styles.heroActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <motion.button
                className={styles.heroCta}
                onClick={goWithConfetti}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {t.landing.hero.cta} <ArrowRight size={20} />
              </motion.button>
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
            { value: 12000, suffix: '+', label: 'слов в базе' },
            { value: 8,     suffix: '',  label: 'режимов обучения' },
            { value: 6,     suffix: '',  label: 'уровней CEFR' },
            { value: 98,    suffix: '%', label: 'довольных учеников' },
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
              <motion.div className={`${styles.bentoCard} ${styles.bentoChatCard}`} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -4 }}>
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
              </motion.div>

              {/* Flashcard flip */}
              <motion.div className={`${styles.bentoCard} ${styles.bentoFlipCard}`} variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className={styles.bentoCardHeader}>
                  <span className={styles.bentoIcon}><Brain size={20} /></span>
                </div>
                <h3 className={styles.bentoTitle}>{t.landing.features.cards}</h3>
                <div className={styles.flipCard}>
                  <div className={styles.flipCardInner}>
                    <div className={styles.flipCardFront}>
                      <div className={styles.flipWord}>Chat</div>
                      <div className={styles.flipHint}>наведи →</div>
                    </div>
                    <div className={styles.flipCardBack}>
                      <div className={styles.flipEmoji}>🐱</div>
                      <div className={styles.flipAnswer}>Кошка</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Grammar */}
              <motion.div className={`${styles.bentoCard} ${styles.bentoGrammarCard}`} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -4 }}>
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
              </motion.div>

              {/* Listening / Sound wave */}
              <motion.div className={`${styles.bentoCard} ${styles.bentoListenCard}`} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -4 }}>
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
              <img src={foxIcon} style={{ height: 26 }} alt="" />
              <span>Попробуй прямо сейчас — без регистрации</span>
            </motion.div>

            <motion.h2 className={styles.sectionTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
              Выучи 3 слова за 60 секунд
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
                          <div className={styles.demoTapHint}>нажми чтобы перевернуть</div>
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
                      <XCircle size={17} /> Не знал
                    </button>
                    <button className={styles.demoBtnRight} onClick={() => handleDemoAnswer(true)}>
                      <CheckCircle size={17} /> Знал!
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
                <h3 className={styles.demoDoneTitle}>Результат: {demoScore.knew} / {DEMO_CARDS.length}</h3>
                <p className={styles.demoDoneText}>Хочешь учить все 12 000 слов?</p>
                <div className={styles.demoDoneActions}>
                  <motion.button
                    className={styles.heroCta}
                    onClick={goWithConfetti}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Начать бесплатно <ArrowRight size={18} />
                  </motion.button>
                  <button className={styles.demoRestart} onClick={resetDemo}>
                    <RotateCcw size={15} /> Ещё раз
                  </button>
                </div>
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
                { num: 1, icon: '📚', title: t.landing.journey.step1, desc: t.landing.journey.step1desc },
                { num: 2, icon: '🧠', title: t.landing.journey.step2, desc: t.landing.journey.step2desc },
                { num: 3, icon: '🗣️', title: t.landing.journey.step3, desc: t.landing.journey.step3desc },
              ].map(s => (
                <motion.div key={s.num} className={styles.step} variants={fadeUp} transition={{ duration: 0.5 }}>
                  <motion.div className={styles.stepNumber} whileHover={{ scale: 1.12, rotate: 6 }}>
                    {s.num}
                  </motion.div>
                  <div className={styles.stepEmoji}>{s.icon}</div>
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

      {/* ═══ CTA BLOCK ═══ */}
      <section className={styles.ctaBlock}>
        <AnimatedSection className={styles.ctaInner}>
          <motion.div variants={fadeUp}>
            <motion.img
              src={foxHero}
              className={styles.ctaFox}
              alt="Fox mascot"
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
          <motion.button
            className={styles.ctaButton}
            onClick={goWithConfetti}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.landing.cta.button}
          </motion.button>
        </AnimatedSection>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <img src={foxIcon} style={{ height: 22 }} alt="FrenchUp" />
            <span className={styles.footerLogo}>FrenchUp</span>
            <span className={styles.footerCopy}>{t.landing.footer.copy.replace('{year}', String(new Date().getFullYear()))}</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="/login" className={styles.footerLink}>{t.landing.nav.login}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
