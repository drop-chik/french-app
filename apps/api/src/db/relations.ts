import { relations } from 'drizzle-orm';
import {
  users,
  words,
  wordProgress,
  grammarTopics,
  grammarExercises,
  grammarProgress,
  listeningExercises,
  listeningProgress,
  conversationSessions,
  oauthAccounts,
} from './schema/index.js';

export const usersRelations = relations(users, ({ many }) => ({
  wordProgress: many(wordProgress),
  grammarProgress: many(grammarProgress),
  listeningProgress: many(listeningProgress),
  conversationSessions: many(conversationSessions),
  oauthAccounts: many(oauthAccounts),
}));

export const wordsRelations = relations(words, ({ many }) => ({
  wordProgress: many(wordProgress),
}));

export const wordProgressRelations = relations(wordProgress, ({ one }) => ({
  user: one(users, { fields: [wordProgress.userId], references: [users.id] }),
  word: one(words, { fields: [wordProgress.wordId], references: [words.id] }),
}));

export const grammarTopicsRelations = relations(grammarTopics, ({ many }) => ({
  exercises: many(grammarExercises),
  progress: many(grammarProgress),
}));

export const grammarExercisesRelations = relations(grammarExercises, ({ one }) => ({
  topic: one(grammarTopics, { fields: [grammarExercises.topicId], references: [grammarTopics.id] }),
}));

export const grammarProgressRelations = relations(grammarProgress, ({ one }) => ({
  user: one(users, { fields: [grammarProgress.userId], references: [users.id] }),
  topic: one(grammarTopics, { fields: [grammarProgress.topicId], references: [grammarTopics.id] }),
}));

export const listeningProgressRelations = relations(listeningProgress, ({ one }) => ({
  user: one(users, { fields: [listeningProgress.userId], references: [users.id] }),
  exercise: one(listeningExercises, { fields: [listeningProgress.exerciseId], references: [listeningExercises.id] }),
}));

export const conversationSessionsRelations = relations(conversationSessions, ({ one }) => ({
  user: one(users, { fields: [conversationSessions.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));
