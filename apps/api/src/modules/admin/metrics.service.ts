import { sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';

// Single source of "user did something on day D" — UNION across the main
// activity-bearing tables. Vocabulary review is the dominant signal but a
// user who only wrote an essay or had a conversation that day still counts.
const ACTIVITY_UNION = sql`
  SELECT user_id, last_reviewed::date AS d FROM word_progress WHERE last_reviewed IS NOT NULL
  UNION ALL
  SELECT user_id, started_at::date AS d FROM conversation_sessions
  UNION ALL
  SELECT user_id, created_at::date AS d FROM writing_submissions
  UNION ALL
  SELECT user_id, completed_at::date AS d FROM listening_progress WHERE completed_at IS NOT NULL
  UNION ALL
  SELECT user_id, completed_at::date AS d FROM reading_progress WHERE completed_at IS NOT NULL
  UNION ALL
  SELECT user_id, last_played_at::date AS d FROM drill_progress WHERE last_played_at IS NOT NULL
`;

export async function getMetricsOverview(db: DB) {
  // ── Totals ──
  const totalsRes = await db.execute(sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS new7d,
      count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS new30d
    FROM users
  `);
  const totals = totalsRes.rows[0] as { total: number; new7d: number; new30d: number };

  // ── DAU / WAU / MAU ── (distinct users active in window)
  const activeRes = await db.execute(sql`
    WITH act AS (${ACTIVITY_UNION})
    SELECT
      count(DISTINCT user_id) FILTER (WHERE d >= current_date)::int      AS dau,
      count(DISTINCT user_id) FILTER (WHERE d >= current_date - 6)::int  AS wau,
      count(DISTINCT user_id) FILTER (WHERE d >= current_date - 29)::int AS mau
    FROM act
  `);
  const active = activeRes.rows[0] as { dau: number; wau: number; mau: number };

  // ── 30-day activity timeseries (distinct active users per day) ──
  const tsRes = await db.execute(sql`
    WITH act AS (${ACTIVITY_UNION})
    SELECT to_char(d, 'YYYY-MM-DD') AS date, count(DISTINCT user_id)::int AS users
    FROM act
    WHERE d >= current_date - 29
    GROUP BY d
    ORDER BY d
  `);
  const timeseries = tsRes.rows as Array<{ date: string; users: number }>;

  // ── Feature usage (all-time distinct users per feature) ──
  const featRes = await db.execute(sql`
    SELECT
      (SELECT count(DISTINCT user_id) FROM word_progress)::int          AS vocab,
      (SELECT count(DISTINCT user_id) FROM grammar_progress)::int       AS grammar,
      (SELECT count(DISTINCT user_id) FROM listening_progress)::int     AS listening,
      (SELECT count(DISTINCT user_id) FROM writing_submissions)::int    AS writing,
      (SELECT count(DISTINCT user_id) FROM conversation_sessions)::int  AS conversation,
      (SELECT count(DISTINCT user_id) FROM reading_progress)::int       AS reading,
      (SELECT count(DISTINCT user_id) FROM drill_progress)::int         AS drills
  `);
  const featureUsage = featRes.rows[0] as Record<string, number>;

  // ── Retention cohorts (last 8 signup weeks) ──
  // For each weekly cohort: how many returned (had any activity) within
  // 1 / 7 / 30 days AFTER signup.
  const cohortRes = await db.execute(sql`
    WITH act AS (${ACTIVITY_UNION}),
    cohorts AS (
      SELECT u.id, date_trunc('week', u.created_at)::date AS cohort_week, u.created_at
      FROM users u
      WHERE u.created_at >= now() - interval '56 days'
    )
    SELECT
      to_char(c.cohort_week, 'YYYY-MM-DD') AS week,
      count(DISTINCT c.id)::int AS size,
      count(DISTINCT c.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = c.id
          AND a.d >  c.created_at::date AND a.d <= c.created_at::date + 1)
      )::int AS d1,
      count(DISTINCT c.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = c.id
          AND a.d >  c.created_at::date AND a.d <= c.created_at::date + 7)
      )::int AS d7,
      count(DISTINCT c.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = c.id
          AND a.d >  c.created_at::date AND a.d <= c.created_at::date + 30)
      )::int AS d30
    FROM cohorts c
    GROUP BY c.cohort_week
    ORDER BY c.cohort_week DESC
  `);
  const retention = cohortRes.rows as Array<{
    week: string; size: number; d1: number; d7: number; d30: number;
  }>;

  // ── Review backlog (overdue words per user) ──
  const backlogRes = await db.execute(sql`
    WITH per_user AS (
      SELECT user_id, count(*)::int AS overdue
      FROM word_progress
      WHERE next_review <= now()
      GROUP BY user_id
    )
    SELECT
      coalesce(round(avg(overdue))::int, 0)                                       AS avg_overdue,
      coalesce(percentile_cont(0.5) WITHIN GROUP (ORDER BY overdue)::int, 0)       AS median_overdue,
      count(*)::int                                                               AS users_with_backlog,
      coalesce(max(overdue), 0)::int                                              AS max_overdue
    FROM per_user
  `);
  const backlog = backlogRes.rows[0] as {
    avg_overdue: number; median_overdue: number; users_with_backlog: number; max_overdue: number;
  };

  // ── Platform accuracy ──
  const accRes = await db.execute(sql`
    SELECT
      coalesce(sum(correct_count), 0)::int   AS correct,
      coalesce(sum(incorrect_count), 0)::int AS incorrect
    FROM word_progress
  `);
  const accRow = accRes.rows[0] as { correct: number; incorrect: number };
  const totalAns = accRow.correct + accRow.incorrect;
  const accuracy = totalAns > 0 ? Math.round((accRow.correct / totalAns) * 100) : 0;

  return {
    totals,
    active,
    timeseries,
    featureUsage,
    retention,
    backlog: {
      avgOverdue: backlog.avg_overdue,
      medianOverdue: backlog.median_overdue,
      usersWithBacklog: backlog.users_with_backlog,
      maxOverdue: backlog.max_overdue,
    },
    accuracy,
  };
}
