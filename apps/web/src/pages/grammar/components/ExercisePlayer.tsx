import { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import type { GrammarExercise, CheckResult } from '../../../features/grammar/api';
import { grammarApi } from '../../../features/grammar/api';
import styles from './ExercisePlayer.module.css';

interface Props {
  exercises: GrammarExercise[];
  topicSlug: string;
  onComplete: (score: number, total: number) => void;
}

export function ExercisePlayer({ exercises, topicSlug, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [fillInputs, setFillInputs] = useState<string[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [score, setScore] = useState(0);
  const [checking, setChecking] = useState(false);

  const exercise = exercises[current]!;
  const isLast = current === exercises.length - 1;

  if (!exercise) return null;

  function handleSelectOption(option: string) {
    if (result) return;
    setAnswers([option]);
  }

  function handleFillChange(index: number, value: string) {
    if (result) return;
    const updated = [...fillInputs];
    updated[index] = value;
    setFillInputs(updated);
  }

  async function handleCheck() {
    if (checking || result) return;
    let answer: unknown;

    if (exercise.type === 'multiple_choice') {
      if (answers.length === 0) return;
      answer = answers[0];
    } else if (exercise.type === 'fill_blank') {
      const blanks = exercise.question.blanks ?? 1;
      const filled = Array.from({ length: blanks }, (_, i) => fillInputs[i] ?? '');
      if (filled.some((v) => !v.trim())) return;
      answer = blanks === 1 ? filled[0] : filled;
    } else {
      return;
    }

    setChecking(true);
    try {
      const res = await grammarApi.checkAnswer(exercise.id, answer);
      setResult(res);
      if (res.correct) setScore((s) => s + 1);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    setResult(null);
    setAnswers([]);
    setFillInputs([]);
    if (isLast) {
      onComplete(score + (result?.correct ? 0 : 0), exercises.length);
      // score already updated via setScore above
    } else {
      setCurrent((c) => c + 1);
    }
  }

  // Handle final next with correct score
  function handleNextFinal() {
    const finalScore = score;
    setResult(null);
    setAnswers([]);
    setFillInputs([]);
    if (isLast) {
      onComplete(finalScore, exercises.length);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  const blanksCount = exercise.question.blanks ?? 1;

  return (
    <div className={styles.player}>
      {/* Progress */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((current) / exercises.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>{current + 1} / {exercises.length}</span>
      </div>

      {/* Question */}
      <div className={styles.question}>
        {exercise.question.text && (
          <p className={styles.questionText}>{exercise.question.text}</p>
        )}
      </div>

      {/* Answer input */}
      {exercise.type === 'multiple_choice' && (
        <div className={styles.options}>
          {exercise.question.options?.map((opt) => {
            const isSelected = answers[0] === opt;
            const isCorrect = result && String(result.correctAnswer) === opt;
            const isWrong = result && isSelected && !result.correct;

            return (
              <button
                key={opt}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isCorrect ? styles.optionCorrect : ''} ${isWrong ? styles.optionWrong : ''}`}
                onClick={() => handleSelectOption(opt)}
                disabled={!!result}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {exercise.type === 'fill_blank' && (
        <div className={styles.fillBlanks}>
          {Array.from({ length: blanksCount }, (_, i) => (
            <input
              key={i}
              className={`${styles.fillInput} ${result ? (result.correct ? styles.inputCorrect : styles.inputWrong) : ''}`}
              value={fillInputs[i] ?? ''}
              onChange={(e) => handleFillChange(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !result && handleCheck()}
              placeholder={blanksCount > 1 ? `Слово ${i + 1}` : 'Ваш ответ...'}
              disabled={!!result}
              autoFocus={i === 0}
            />
          ))}
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div className={`${styles.feedback} ${result.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}>
          <div className={styles.feedbackHeader}>
            {result.correct ? (
              <CheckCircle size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span>{result.correct ? 'Правильно!' : 'Неправильно'}</span>
          </div>
          {!result.correct && (
            <p className={styles.feedbackAnswer}>
              Правильный ответ: <strong>{String(result.correctAnswer)}</strong>
            </p>
          )}
          {result.explanation && (
            <p className={styles.feedbackExplanation}>{result.explanation}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {!result ? (
          <button
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={
              checking ||
              (exercise.type === 'multiple_choice' && answers.length === 0) ||
              (exercise.type === 'fill_blank' && fillInputs.slice(0, blanksCount).some((v) => !v?.trim()))
            }
          >
            {checking ? 'Проверка...' : 'Проверить'}
          </button>
        ) : (
          <button className={styles.nextBtn} onClick={handleNextFinal}>
            {isLast ? 'Завершить' : 'Далее'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
