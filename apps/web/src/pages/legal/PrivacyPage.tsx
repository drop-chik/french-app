import { Link } from '@tanstack/react-router';
import foxIcon from '../landing/fox-icon.webp';
import { useI18n } from '../../shared/i18n';
import styles from './LegalPage.module.css';

const CONTACT_EMAIL = 'the.lord.kraid@gmail.com';

export function PrivacyPage() {
  const { t } = useI18n();
  const p = t.legal.privacy;
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link to="/" className={styles.back}>{t.legal.backHome}</Link>

        <div className={styles.header}>
          <Link to="/" className={styles.logoRow}>
            <img src={foxIcon} className={styles.logoIcon} alt="FrenchUp" />
            <span className={styles.logoText}>FrenchUp</span>
          </Link>
          <h1 className={styles.title}>{t.legal.privacyTitle}</h1>
          <p className={styles.updated}>{t.legal.lastUpdated}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.highlight}>{p.intro}</div>
          </div>

          <div className={styles.section}>
            <h2>{p.s1Title}</h2>
            <p>
              {p.s1Body}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>

          <div className={styles.section}>
            <h2>{p.s2Title}</h2>
            <ul>
              <li><strong>{p.s2AccountLabel}</strong> {p.s2Account}</li>
              <li><strong>{p.s2GoogleLabel}</strong> {p.s2Google}</li>
              <li><strong>{p.s2LearningLabel}</strong> {p.s2Learning}</li>
              <li><strong>{p.s2UgcLabel}</strong> {p.s2Ugc}</li>
              <li><strong>{p.s2TechLabel}</strong> {p.s2Tech}</li>
              <li><strong>{p.s2PushLabel}</strong> {p.s2Push}</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>{p.s3Title}</h2>
            <ul>
              <li>{p.s3Item1}</li>
              <li>{p.s3Item2}</li>
              <li>{p.s3Item3}</li>
              <li>{p.s3Item4}</li>
              <li>{p.s3Item5}</li>
            </ul>
            <p style={{ marginTop: 'var(--space-3)' }}>
              {p.s3NoSell} <strong>{p.s3NoSellStrong}</strong> {p.s3NoSellAfter}
            </p>
          </div>

          <div className={styles.section}>
            <h2>{p.s4Title}</h2>
            <p>{p.s4Intro}</p>
            <ul>
              <li>
                <strong>{p.s4RailwayLabel}</strong> {p.s4Railway}{' '}
                <a href="https://railway.app/legal/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy →
                </a>
              </li>
              <li>
                <strong>{p.s4VercelLabel}</strong> {p.s4Vercel}{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
                  Privacy Policy →
                </a>
              </li>
              <li>
                <strong>{p.s4OpenaiLabel}</strong> {p.s4Openai}{' '}
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer">
                  Privacy Policy →
                </a>
              </li>
              <li>
                <strong>{p.s4GoogleLabel}</strong> {p.s4Google}{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy →
                </a>
              </li>
              <li><strong>{p.s4PushLabel}</strong> {p.s4Push}</li>
            </ul>
            <p style={{ marginTop: 'var(--space-3)' }}>{p.s4Transfer}</p>
            <p style={{ marginTop: 'var(--space-2)' }}>{p.s4NoOther}</p>
          </div>

          <div className={styles.section}>
            <h2>{p.s5Title}</h2>
            <ul>
              <li>{p.s5Item1}</li>
              <li>{p.s5Item2}</li>
              <li>{p.s5Item3}</li>
              <li>{p.s5Item4}</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>{p.s6Title}</h2>
            <ul>
              <li><strong>{p.s6Item1Label}</strong> {p.s6Item1}</li>
              <li><strong>{p.s6Item2Label}</strong> {p.s6Item2}</li>
              <li><strong>{p.s6Item3Label}</strong> {p.s6Item3}</li>
              <li><strong>{p.s6Item4Label}</strong> {p.s6Item4}</li>
              <li><strong>{p.s6Item5Label}</strong> {p.s6Item5}</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>{p.s7Title}</h2>
            <p>{p.s7Body}</p>
          </div>

          <div className={styles.section}>
            <h2>{p.s8Title}</h2>
            <p>{p.s8Body}</p>
          </div>

          <div className={styles.section}>
            <h2>{p.s9Title}</h2>
            <p>{p.s9Body}</p>
          </div>

          <div className={styles.section}>
            <h2>{p.s10Title}</h2>
            <p>
              {p.s10Body} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <Link to="/" className={styles.footerLink}>{t.nav.dashboard}</Link>
          <a href="/terms" className={styles.footerLink}>{t.legal.termsTitle}</a>
        </div>
      </div>
    </div>
  );
}
