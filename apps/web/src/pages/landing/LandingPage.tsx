import { useNavigate } from '@tanstack/react-router';
import { Brain, Bot, BookOpen, Headphones, Layers, Zap, PenTool, Grid3X3, Ear, Type, ArrowRight, TrendingUp, MessageCircle } from 'lucide-react';
import { useI18n } from '../../shared/i18n';
import { FoxLogo, FoxHero, FoxMini } from './FoxMascot';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const goLogin = () => navigate({ to: '/login' });

  return (
    <div className={styles.landing}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <FoxLogo size={32} />
            <span className={styles.navLogoText}>FrenchUp</span>
          </div>
          <div className={styles.navButtons}>
            <button className={styles.navLogin} onClick={goLogin}>{t.landing.nav.login}</button>
            <button className={styles.navCta} onClick={goLogin}>{t.landing.nav.cta}</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>{t.landing.hero.title}</h1>
            <p className={styles.heroSubtitle}>{t.landing.hero.subtitle}</p>
            <button className={styles.heroCta} onClick={goLogin}>
              {t.landing.hero.cta} <ArrowRight size={20} />
            </button>
            <p className={styles.heroNote}>{t.landing.hero.note}</p>
          </div>
          <div className={styles.heroIllustration}>
            <FoxHero className={styles.heroFox} />
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className={styles.proof}>
        <div className={styles.proofInner}>
          {[
            { icon: <TrendingUp size={20} />, text: t.landing.proof.levels },
            { icon: <Layers size={20} />, text: t.landing.proof.words },
            { icon: <MessageCircle size={20} />, text: t.landing.proof.ai },
            { icon: <Grid3X3 size={20} />, text: t.landing.proof.modes },
          ].map((item, i) => (
            <div key={i} className={styles.proofItem}>
              <div className={styles.proofIcon}>{item.icon}</div>
              <span className={styles.proofText}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>{t.landing.features.title}</h2>
          <div className={styles.featuresGrid}>
            {[
              { icon: <Brain size={28} />, title: t.landing.features.cards, desc: t.landing.features.cardsDesc },
              { icon: <Bot size={28} />, title: t.landing.features.aiChat, desc: t.landing.features.aiChatDesc },
              { icon: <BookOpen size={28} />, title: t.landing.features.grammar, desc: t.landing.features.grammarDesc },
              { icon: <Headphones size={28} />, title: t.landing.features.listening, desc: t.landing.features.listeningDesc },
            ].map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journey ── */}
      <section className={styles.journey}>
        <div className={styles.journeyInner}>
          <h2 className={styles.sectionTitle}>{t.landing.journey.title}</h2>
          <div className={styles.journeySteps}>
            {[
              { num: 1, pose: 'search' as const, title: t.landing.journey.step1, desc: t.landing.journey.step1desc },
              { num: 2, pose: 'read' as const, title: t.landing.journey.step2, desc: t.landing.journey.step2desc },
              { num: 3, pose: 'speak' as const, title: t.landing.journey.step3, desc: t.landing.journey.step3desc },
            ].map((s) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepNumber}>{s.num}</div>
                <FoxMini pose={s.pose} className={styles.stepFox} />
                <div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 Modes ── */}
      <section className={styles.modes}>
        <div className={styles.modesInner}>
          <h2 className={styles.sectionTitle}>{t.landing.modes.title}</h2>
          <div className={styles.modesGrid}>
            {[
              { icon: <Layers size={24} />, name: t.landing.modes.flashcard },
              { icon: <Grid3X3 size={24} />, name: t.landing.modes.multipleChoice },
              { icon: <PenTool size={24} />, name: t.landing.modes.spelling },
              { icon: <Zap size={24} />, name: t.landing.modes.matching },
              { icon: <Type size={24} />, name: t.landing.modes.fillBlank },
              { icon: <Ear size={24} />, name: t.landing.modes.listening },
              { icon: <Zap size={24} />, name: t.landing.modes.speedRound },
              { icon: <BookOpen size={24} />, name: t.landing.modes.context },
            ].map((m, i) => (
              <div key={i} className={styles.modeCard}>
                <span className={styles.modeIcon}>{m.icon}</span>
                <span className={styles.modeName}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Block ── */}
      <section className={styles.ctaBlock}>
        <div className={styles.ctaInner}>
          <FoxLogo size={64} className={styles.ctaFox} />
          <h2 className={styles.ctaTitle}>{t.landing.cta.title}</h2>
          <p className={styles.ctaSubtitle}>{t.landing.cta.subtitle}</p>
          <button className={styles.ctaButton} onClick={goLogin}>
            {t.landing.cta.button}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <FoxLogo size={20} />
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
