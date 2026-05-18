import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { socialApi, type ActivityEvent } from '../../features/social/api';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import styles from './FriendsPage.module.css';

function eventLine(
  ev: ActivityEvent,
  lang: 'ru' | 'en',
  t: Translations,
): string {
  const p = ev.payload;
  switch (ev.type) {
    case 'level_up':
      return `⭐ ${t.social.evLevelUp.replace('{level}', String(p['level'] ?? ''))}`;
    case 'streak':
      return `🔥 ${t.social.evStreak.replace('{days}', String(p['days'] ?? ''))}`;
    case 'achievement': {
      const title = lang === 'ru'
        ? String(p['titleRu'] ?? p['titleEn'] ?? '')
        : String(p['titleEn'] ?? p['titleRu'] ?? '');
      return `🏆 ${t.social.evAchievement.replace('{title}', title)}`;
    }
    case 'joined':
    default:
      return `🎉 ${t.social.evJoined}`;
  }
}

export function PublicProfilePage({ tag }: { tag: string }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['social-profile', tag],
    queryFn: () => socialApi.getProfile(tag),
    retry: false,
  });

  const [followOverride, setFollowOverride] = useState<boolean | null>(null);

  const followMut = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? socialApi.follow(data!.profile.id)
        : socialApi.unfollow(data!.profile.id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['social-profile', tag] });
      qc.invalidateQueries({ queryKey: ['social-following'] });
      qc.invalidateQueries({ queryKey: ['social-leaderboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.page}>
        <Link to="/friends" className={styles.back}>{t.social.backToFriends}</Link>
        <p className={styles.empty}>{t.social.profileNotFound}</p>
      </div>
    );
  }

  const { profile, stats, streak, charts, social, recentActivity, isSelf } = data;
  const following = followOverride ?? social.isFollowing;
  const memberSince = new Date(profile.createdAt).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long' },
  );

  const activity = charts?.activity ?? [];
  const maxRev = Math.max(1, ...activity.map((a) => a.reviewed));

  return (
    <div className={styles.page}>
      <Link to="/friends" className={styles.back}>{t.social.backToFriends}</Link>

      <div className={styles.hero}>
        <div className={`${styles.avatar} ${styles.heroAvatar}`}>
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt="" className={styles.avatarImg} />
            : profile.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroName}>{profile.name}</h1>
          <div className={styles.heroTag}>
            @{profile.tag} · {t.social.levelShort} {profile.xpLevel} · {profile.level}
          </div>
          <div className={styles.heroMeta}>
            <span><span className={styles.heroMetaNum}>{social.followers}</span> {t.social.followers}</span>
            <span><span className={styles.heroMetaNum}>{social.following}</span> {t.social.followingCount}</span>
            <span>{t.social.memberSince} {memberSince}</span>
          </div>
        </div>
        {!isSelf && (
          <button
            className={`${styles.heroFollow} ${following ? styles.heroFollowActive : ''}`}
            disabled={followMut.isPending}
            onClick={() => {
              const next = !following;
              setFollowOverride(next);
              followMut.mutate(next);
            }}
          >
            {following ? t.social.unfollow : t.social.follow}
          </button>
        )}
      </div>

      {stats && (
        <div className={styles.statGrid}>
          <Stat label={t.profile.wordStatusMastered} value={stats.words.mastered} />
          <Stat label={t.profile.wordStatusLearning} value={stats.words.learning} />
          <Stat label={t.profile.wordStatusNew} value={stats.words.new} />
          <Stat label={t.profile.streakTitle} value={streak?.streak ?? 0} />
          <Stat label={t.nav.grammar} value={stats.grammar.completed} />
          <Stat label={t.nav.listening} value={stats.listening.completed} />
          <Stat label={t.nav.conversations} value={stats.conversations} />
          <Stat label={t.profile.insightReviewTitle} value={stats.wordsDueToday} />
        </div>
      )}

      {activity.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t.profile.activityTitle}</h3>
          <div className={styles.spark}>
            {activity.slice(-60).map((a, i) => (
              <div
                key={i}
                className={styles.sparkBar}
                style={{ height: `${Math.max(6, (a.reviewed / maxRev) * 100)}%` }}
                title={`${a.date}: ${a.reviewed}`}
              />
            ))}
          </div>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t.social.recentActivity}</h3>
          <div className={styles.recentList}>
            {recentActivity.map((ev) => (
              <div key={ev.id} className={styles.recentRow}>
                <span>{eventLine(ev, lang, t)}</span>
                <span className={styles.recentTime}>
                  {new Date(ev.createdAt).toLocaleDateString(
                    lang === 'ru' ? 'ru-RU' : 'en-US',
                    { day: '2-digit', month: '2-digit' },
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
