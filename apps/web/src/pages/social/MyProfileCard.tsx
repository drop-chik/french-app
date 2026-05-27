import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import qrcode from 'qrcode-generator';
import { Share2, QrCode, Copy, Check, X } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import { useI18n } from '../../shared/i18n';
import styles from './FriendsPage.module.css';

function profileUrl(tag: string): string {
  return `${window.location.origin}/u/${tag}`;
}

// Build a crisp SVG QR (black modules on white, 4-module quiet zone).
// qrcode-generator is zero-dependency and runs fully offline — the tag
// never leaves the device.
function QrSvg({ url, size = 220 }: { url: string; size?: number }) {
  const { d, dim } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const pad = 4;
    let path = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) path += `M${c + pad} ${r + pad}h1v1h-1z`;
      }
    }
    return { d: path, dim: count + pad * 2 };
  }, [url]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR"
    >
      <rect width={dim} height={dim} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

export function MyProfileCard() {
  const { t } = useI18n();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: Infinity,
  });
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!profile) return null;
  const url = profileUrl(profile.tag);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${profile!.tag} · FrenchUp`, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    void copy();
  }

  return (
    <div className={styles.myCard} data-tour="friends-mycard">
      <div className={styles.avatar}>
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt="" className={styles.avatarImg} loading="lazy" />
          : (profile.name.charAt(0).toUpperCase() || '?')}
      </div>
      <div className={styles.cardMain}>
        <span className={styles.cardName}>{profile.name}</span>
        <span className={styles.cardTag}>@{profile.tag}</span>
      </div>
      <div className={styles.myCardActions}>
        <button className={styles.myCardBtn} onClick={share}>
          {copied ? <Check size={15} /> : <Share2 size={15} />}
          {copied ? t.social.linkCopied : t.social.share}
        </button>
        <button
          className={styles.myCardIconBtn}
          onClick={() => setShowQr(true)}
          aria-label={t.social.qr}
          title={t.social.qr}
        >
          <QrCode size={17} />
        </button>
      </div>

      {showQr && (
        <div
          className={styles.qrBackdrop}
          onClick={() => setShowQr(false)}
          role="presentation"
        >
          <div className={styles.qrModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.qrClose}
              onClick={() => setShowQr(false)}
              aria-label={t.social.close}
            >
              <X size={18} />
            </button>
            <div className={styles.qrBox}>
              <QrSvg url={url} />
            </div>
            <p className={styles.qrTag}>@{profile.tag}</p>
            <p className={styles.qrHint}>{t.social.qrHint}</p>
            <button className={styles.myCardBtn} onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? t.social.linkCopied : t.social.copyLink}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
