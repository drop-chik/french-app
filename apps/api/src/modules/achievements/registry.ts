/**
 * Achievement catalog. Adding a new achievement = appending an entry here.
 * Each achievement has:
 *  - id: stable string key, stored in user_achievements.achievement_id
 *  - category: visual grouping in the UI
 *  - icon: emoji shown on the badge
 *  - titleRu/titleEn, descRu/descEn: shown in the UI
 *  - threshold + metric: criterion the user must meet for unlock
 *  - rarity: bronze | silver | gold | legendary — visual tint only
 */

export type AchievementMetric =
  | 'wordsMastered'
  | 'wordsLearning'       // words user has ever started reviewing
  | 'streakDays'
  | 'grammarCompleted'
  | 'listeningCompleted'
  | 'conversationsCount'
  | 'readingTextsCompleted'
  | 'correctAnswersTotal'
  | 'totalXp';

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface AchievementDef {
  id: string;
  category: 'words' | 'streak' | 'grammar' | 'listening' | 'reading' | 'conversation' | 'general';
  icon: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  metric: AchievementMetric;
  threshold: number;
  rarity: AchievementRarity;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ── Words ─────────────────────────────────────────────────────────────────
  {
    id: 'first_word', category: 'words', icon: '🌱', rarity: 'bronze',
    titleRu: 'Первое слово', titleEn: 'First word',
    descRu: 'Изучи своё первое слово', descEn: 'Start learning your first word',
    metric: 'wordsLearning', threshold: 1,
  },
  {
    id: 'words_10', category: 'words', icon: '📚', rarity: 'bronze',
    titleRu: 'Десятка', titleEn: 'Tenfold',
    descRu: 'Освой 10 слов', descEn: 'Master 10 words',
    metric: 'wordsMastered', threshold: 10,
  },
  {
    id: 'words_50', category: 'words', icon: '📖', rarity: 'silver',
    titleRu: 'Полка', titleEn: 'Shelf',
    descRu: 'Освой 50 слов', descEn: 'Master 50 words',
    metric: 'wordsMastered', threshold: 50,
  },
  {
    id: 'words_100', category: 'words', icon: '📕', rarity: 'silver',
    titleRu: 'Сотня', titleEn: 'Centurion',
    descRu: 'Освой 100 слов', descEn: 'Master 100 words',
    metric: 'wordsMastered', threshold: 100,
  },
  {
    id: 'words_500', category: 'words', icon: '🎓', rarity: 'gold',
    titleRu: 'Эрудит', titleEn: 'Erudite',
    descRu: 'Освой 500 слов', descEn: 'Master 500 words',
    metric: 'wordsMastered', threshold: 500,
  },
  {
    id: 'words_1000', category: 'words', icon: '🧠', rarity: 'legendary',
    titleRu: 'Тысячник', titleEn: 'Polyglot',
    descRu: 'Освой 1000 слов', descEn: 'Master 1000 words',
    metric: 'wordsMastered', threshold: 1000,
  },

  // ── Streak ────────────────────────────────────────────────────────────────
  {
    id: 'streak_3', category: 'streak', icon: '🔥', rarity: 'bronze',
    titleRu: 'Три подряд', titleEn: 'Three in a row',
    descRu: '3 дня подряд занятий', descEn: '3-day streak',
    metric: 'streakDays', threshold: 3,
  },
  {
    id: 'streak_7', category: 'streak', icon: '🔥', rarity: 'silver',
    titleRu: 'Неделя', titleEn: 'Week strong',
    descRu: '7 дней подряд занятий', descEn: '7-day streak',
    metric: 'streakDays', threshold: 7,
  },
  {
    id: 'streak_30', category: 'streak', icon: '🔥', rarity: 'gold',
    titleRu: 'Месяц', titleEn: 'Month strong',
    descRu: '30 дней подряд занятий', descEn: '30-day streak',
    metric: 'streakDays', threshold: 30,
  },
  {
    id: 'streak_100', category: 'streak', icon: '🔥', rarity: 'legendary',
    titleRu: 'Сотня дней', titleEn: 'Hundred days',
    descRu: '100 дней подряд занятий', descEn: '100-day streak',
    metric: 'streakDays', threshold: 100,
  },

  // ── Grammar ───────────────────────────────────────────────────────────────
  {
    id: 'grammar_1', category: 'grammar', icon: '📝', rarity: 'bronze',
    titleRu: 'Первая тема', titleEn: 'First topic',
    descRu: 'Заверши первую тему грамматики', descEn: 'Complete your first grammar topic',
    metric: 'grammarCompleted', threshold: 1,
  },
  {
    id: 'grammar_10', category: 'grammar', icon: '🧩', rarity: 'silver',
    titleRu: 'Грамматик', titleEn: 'Grammarian',
    descRu: 'Заверши 10 тем грамматики', descEn: 'Complete 10 grammar topics',
    metric: 'grammarCompleted', threshold: 10,
  },
  {
    id: 'grammar_25', category: 'grammar', icon: '🎯', rarity: 'gold',
    titleRu: 'Знаток грамматики', titleEn: 'Grammar expert',
    descRu: 'Заверши 25 тем грамматики', descEn: 'Complete 25 grammar topics',
    metric: 'grammarCompleted', threshold: 25,
  },

  // ── Listening ─────────────────────────────────────────────────────────────
  {
    id: 'listen_1', category: 'listening', icon: '🎧', rarity: 'bronze',
    titleRu: 'Первое аудио', titleEn: 'First audio',
    descRu: 'Пройди первое упражнение на аудирование', descEn: 'Complete your first listening exercise',
    metric: 'listeningCompleted', threshold: 1,
  },
  {
    id: 'listen_10', category: 'listening', icon: '🎶', rarity: 'silver',
    titleRu: 'Меломан', titleEn: 'Audiophile',
    descRu: 'Пройди 10 упражнений на аудирование', descEn: 'Complete 10 listening exercises',
    metric: 'listeningCompleted', threshold: 10,
  },

  // ── Reading ───────────────────────────────────────────────────────────────
  {
    id: 'reading_1', category: 'reading', icon: '📜', rarity: 'bronze',
    titleRu: 'Первый текст', titleEn: 'First text',
    descRu: 'Прочитай первый текст', descEn: 'Read your first text',
    metric: 'readingTextsCompleted', threshold: 1,
  },
  {
    id: 'reading_10', category: 'reading', icon: '📰', rarity: 'silver',
    titleRu: 'Книжный червь', titleEn: 'Bookworm',
    descRu: 'Прочитай 10 текстов', descEn: 'Read 10 texts',
    metric: 'readingTextsCompleted', threshold: 10,
  },

  // ── Conversation ──────────────────────────────────────────────────────────
  {
    id: 'chat_1', category: 'conversation', icon: '💬', rarity: 'bronze',
    titleRu: 'Первый диалог', titleEn: 'First chat',
    descRu: 'Проведи первую беседу с ИИ', descEn: 'Start your first AI conversation',
    metric: 'conversationsCount', threshold: 1,
  },
  {
    id: 'chat_10', category: 'conversation', icon: '🗣️', rarity: 'silver',
    titleRu: 'Собеседник', titleEn: 'Conversationalist',
    descRu: 'Проведи 10 бесед', descEn: 'Have 10 conversations',
    metric: 'conversationsCount', threshold: 10,
  },

  // ── General / XP milestones ───────────────────────────────────────────────
  {
    id: 'xp_500', category: 'general', icon: '⭐', rarity: 'bronze',
    titleRu: 'Восходящая звезда', titleEn: 'Rising star',
    descRu: 'Заработай 500 XP', descEn: 'Earn 500 XP',
    metric: 'totalXp', threshold: 500,
  },
  {
    id: 'xp_2000', category: 'general', icon: '🌟', rarity: 'silver',
    titleRu: 'Усердный', titleEn: 'Diligent',
    descRu: 'Заработай 2 000 XP', descEn: 'Earn 2 000 XP',
    metric: 'totalXp', threshold: 2000,
  },
  {
    id: 'xp_10000', category: 'general', icon: '🏆', rarity: 'gold',
    titleRu: 'Чемпион', titleEn: 'Champion',
    descRu: 'Заработай 10 000 XP', descEn: 'Earn 10 000 XP',
    metric: 'totalXp', threshold: 10000,
  },
  {
    id: 'correct_500', category: 'general', icon: '✅', rarity: 'silver',
    titleRu: 'Меткий', titleEn: 'Sharp',
    descRu: '500 правильных ответов', descEn: '500 correct answers',
    metric: 'correctAnswersTotal', threshold: 500,
  },
];

/** Achievement IDs grouped for quick membership lookups. */
export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));

export function getAchievementById(id: string): AchievementDef | null {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
}
