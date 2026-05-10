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
  writingPrompts,
  writingSubmissions,
  writingFeedback,
  writingProgress,
} from './schema/index.js';

export const usersRelations = relations(users, ({ many, one }) => ({
  wordProgress: many(wordProgress),
  grammarProgress: many(grammarProgress),
  listeningProgress: many(listeningProgress),
  conversationSessions: many(conversationSessions),
  oauthAccounts: many(oauthAccounts),
  writingSubmissions: many(writingSubmissions),
  writingProgress: one(writingProgress, { fields: [users.id], references: [writingProgress.userId] }),
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

// Writing relations
export const writingPromptsRelations = relations(writingPrompts, ({ many }) => ({
  submissions: many(writingSubmissions),
}));

export const writingSubmissionsRelations = relations(writingSubmissions, ({ one }) => ({
  user: one(users, { fields: [writingSubmissions.userId], references: [users.id] }),
  prompt: one(writingPrompts, { fields: [writingSubmissions.promptId], references: [writingPrompts.id] }),
  feedback: one(writingFeedback, { fields: [writingSubmissions.id], references: [writingFeedback.submissionId] }),
}));

export const writingFeedbackRelations = relations(writingFeedback, ({ one }) => ({
  submission: one(writingSubmissions, { fields: [writingFeedback.submissionId], references: [writingSubmissions.id] }),
}));

export const writingProgressRelations = relations(writingProgress, ({ one }) => ({
  user: one(users, { fields: [writingProgress.userId], references: [users.id] }),
}));

