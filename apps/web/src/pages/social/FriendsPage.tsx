import { useState } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Users, Activity, Trophy, Search, X, Loader2, UserPlus,
} from 'lucide-react';
import { socialApi, type UserCard, type FeedItem } from '../../features/social/api';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import { MyProfileCard } from './MyProfileCard';
import styles from './FriendsPage.module.css';

type Tab = 'feed' | 'leaderboard' | 'search' | 'following';

function relTime(iso: string, lang: 'ru' | 'en'): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return lang === 'ru' ? 'только что' : 'just now';
  if (m < 60) return lang === 'ru' ? `${m} мин назад` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'ru' ? `${h} ч назад` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return lang === 'ru' ? `${d} дн назад` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit', month: '2-digit',
  });
}

function Avatar({ url, name, cls }: { url: string | null; name: string; cls?: string }) {
  return (
    <div className={`${styles.avatar} ${cls ?? ''}`}>
      {url
        ? <img src={url} alt="" className={styles.avatarImg} />
        : (name.charAt(0).toUpperCase() || '?')}
    </div>
  );
}

export function FriendsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('feed');

  const tabs: Array<{ key: Tab; label: string; icon: typeof Activity }> = [
    { key: 'feed', label: t.social.tabFeed, icon: Activity },
    { key: 'leaderboard', label: t.social.tabLeaderboard, icon: Trophy },
    { key: 'search', label: t.social.tabSearch, icon: Search },
    { key: 'following', label: t.social.tabFollowing, icon: UserPlus },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Users size={22} className={styles.headerIcon} />
        <h1 className={styles.title}>{t.social.title}</h1>
      </div>

      <MyProfileCard />

      <div className={styles.tabs}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'feed' && <FeedTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'search' && <SearchTab />}
      {tab === 'following' && <FollowingTab />}
    </div>
  );
}

// ── Follow button (optimistic) ──────────────────────────────
function FollowButton({ userId, following }: { userId: string; following: boolean }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [on, setOn] = useState(following);

  const mut = useMutation({
    mutationFn: (next: boolean) =>
      next ? socialApi.follow(userId) : socialApi.unfollow(userId),
    onSettled: () => {
      for (const k of ['social-following', 'social-followers', 'social-search', 'social-leaderboard', 'social-feed']) {
        qc.invalidateQueries({ queryKey: [k] });
      }
    },
  });

  return (
    <button
      className={`${styles.followBtn} ${on ? styles.followBtnActive : ''}`}
      disabled={mut.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !on;
        setOn(next);
        mut.mutate(next);
      }}
    >
      {on ? t.social.unfollow : t.social.follow}
    </button>
  );
}

function UserRow({ u }: { u: UserCard }) {
  const { t } = useI18n();
  return (
    <div className={styles.card}>
      <Link to="/u/$tag" params={{ tag: u.tag }} className={styles.cardLink}>
        <Avatar url={u.avatarUrl} name={u.name} />
        <div className={styles.cardMain}>
          <span className={styles.cardName}>{u.name}</span>
          <span className={styles.cardTag}>@{u.tag} · {t.social.levelShort} {u.xpLevel}</span>
        </div>
        <span className={styles.levelChip}>{u.level}</span>
      </Link>
      <FollowButton userId={u.id} following={u.isFollowing} />
    </div>
  );
}

// ── Feed ────────────────────────────────────────────────────
function FeedTab() {
  const { t, lang } = useI18n();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['social-feed'],
      queryFn: ({ pageParam }) => socialApi.feed(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      staleTime: 30_000,
    });

  if (isLoading) {
    return <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>;
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) {
    return <p className={styles.empty}>{t.social.feedEmpty}</p>;
  }

  return (
    <>
      <div className={styles.list}>
        {items.map((it) => <FeedRow key={it.id} item={it} lang={lang} />)}
      </div>
      {hasNextPage && (
        <button
          className={styles.loadMore}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '…' : t.social.feedLoadMore}
        </button>
      )}
    </>
  );
}

function eventText(
  item: FeedItem,
  lang: 'ru' | 'en',
  t: Translations,
): { emoji: string; text: string } {
  const p = item.payload;
  switch (item.type) {
    case 'level_up':
      return { emoji: '⭐', text: t.social.evLevelUp.replace('{level}', String(p['level'] ?? '')) };
    case 'streak':
      return { emoji: '🔥', text: t.social.evStreak.replace('{days}', String(p['days'] ?? '')) };
    case 'achievement': {
      const title = lang === 'ru'
        ? String(p['titleRu'] ?? p['titleEn'] ?? '')
        : String(p['titleEn'] ?? p['titleRu'] ?? '');
      return { emoji: '🏆', text: t.social.evAchievement.replace('{title}', title) };
    }
    case 'joined':
    default:
      return { emoji: '🎉', text: t.social.evJoined };
  }
}

function FeedRow({ item, lang }: { item: FeedItem; lang: 'ru' | 'en' }) {
  const { t } = useI18n();
  const [reacted, setReacted] = useState(item.myReacted);
  const [count, setCount] = useState(item.reactionCount);

  const mut = useMutation({
    mutationFn: (next: boolean) =>
      next ? socialApi.react(item.id) : socialApi.unreact(item.id),
  });

  const { emoji, text } = eventText(item, lang, t);

  return (
    <div className={styles.feedItem}>
      <Link to="/u/$tag" params={{ tag: item.actor.tag }}>
        <Avatar url={item.actor.avatarUrl} name={item.actor.name} />
      </Link>
      <div className={styles.feedBody}>
        <div className={styles.feedText}>
          <span className={styles.feedEmoji}>{emoji}</span>
          <Link
            to="/u/$tag"
            params={{ tag: item.actor.tag }}
            className={styles.feedActor}
          >
            {item.actor.name}
          </Link>{' '}
          {text}
        </div>
        <div className={styles.feedTime}>{relTime(item.createdAt, lang)}</div>
        <button
          className={`${styles.reactBtn} ${reacted ? styles.reactBtnActive : ''}`}
          disabled={mut.isPending}
          onClick={() => {
            const next = !reacted;
            setReacted(next);
            setCount((c) => c + (next ? 1 : -1));
            mut.mutate(next);
          }}
        >
          👏 {count > 0 ? count : ''}
        </button>
      </div>
    </div>
  );
}

// ── Leaderboard ─────────────────────────────────────────────
function LeaderboardTab() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['social-leaderboard'],
    queryFn: socialApi.leaderboard,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>;
  }
  const board = data?.board ?? [];
  if (board.length <= 1) {
    return <p className={styles.empty}>{t.social.leaderboardEmpty}</p>;
  }

  return (
    <>
      <p className={styles.lbSub}>{t.social.leaderboardSub}</p>
      {board.map((r, i) => (
        <Link
          key={r.id}
          to="/u/$tag"
          params={{ tag: r.tag }}
          className={`${styles.lbRow} ${r.isMe ? styles.lbRowMe : ''}`}
        >
          <span className={styles.lbRank}>{i + 1}</span>
          <Avatar url={r.avatarUrl} name={r.name} />
          <div className={styles.cardMain}>
            <span className={styles.cardName}>
              {r.name}{r.isMe ? ` (${t.social.you})` : ''}
            </span>
            <span className={styles.cardTag}>@{r.tag} · {t.social.levelShort} {r.xpLevel}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.lbScore}>{r.weekScore}</div>
            <div className={styles.lbScoreLabel}>{t.social.leaderboardTitle}</div>
          </div>
        </Link>
      ))}
    </>
  );
}

// ── Search ──────────────────────────────────────────────────
function SearchTab() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const { data, isFetching } = useQuery({
    queryKey: ['social-search', q],
    queryFn: () => socialApi.search(q),
    enabled: q.trim().length >= 2,
    staleTime: 15_000,
  });

  const results = data?.results ?? [];

  return (
    <>
      <div className={styles.searchBox}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.social.searchPlaceholder}
          autoFocus
        />
        {q && (
          <button className={styles.searchClear} onClick={() => setQ('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {q.trim().length < 2 ? (
        <p className={styles.empty}>{t.social.searchHint}</p>
      ) : isFetching && results.length === 0 ? (
        <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
      ) : results.length === 0 ? (
        <p className={styles.empty}>{t.social.nothingFound}</p>
      ) : (
        <div className={styles.list}>
          {results.map((u) => <UserRow key={u.id} u={u} />)}
        </div>
      )}
    </>
  );
}

// ── Following / Followers ───────────────────────────────────
function FollowingTab() {
  const { t } = useI18n();
  const [sub, setSub] = useState<'following' | 'followers'>('following');

  const { data, isLoading } = useQuery({
    queryKey: [sub === 'following' ? 'social-following' : 'social-followers'],
    queryFn: sub === 'following' ? socialApi.following : socialApi.followers,
    staleTime: 30_000,
  });

  const users = data?.users ?? [];

  return (
    <>
      <div className={styles.subToggle}>
        <button
          className={`${styles.subToggleBtn} ${sub === 'following' ? styles.subToggleBtnActive : ''}`}
          onClick={() => setSub('following')}
        >
          {t.social.iFollow}
        </button>
        <button
          className={`${styles.subToggleBtn} ${sub === 'followers' ? styles.subToggleBtnActive : ''}`}
          onClick={() => setSub('followers')}
        >
          {t.social.myFollowers}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
      ) : users.length === 0 ? (
        <p className={styles.empty}>
          {sub === 'following' ? t.social.noFollowing : t.social.noFollowers}
        </p>
      ) : (
        <div className={styles.list}>
          {users.map((u) => <UserRow key={u.id} u={u} />)}
        </div>
      )}
    </>
  );
}
