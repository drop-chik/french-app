import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft, Play, Pause, Volume2, ChevronDown, ChevronUp, CheckCircle, XCircle,
  Rewind, FastForward,
} from 'lucide-react';
import { listeningApi } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './ListeningExercisePage.module.css';

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/** Split a French transcript into sentences. Keeps . ! ? as endings. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ExerciseSkeleton() {
  return (
    <div className={styles.page}>
      <div className={`${styles.skeletonBlock} ${styles.skeletonButton}`} />
      <div className={styles.header}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
      </div>
      <div className={`${styles.skeletonBlock} ${styles.skeletonPlayer}`} />
      <div className={`${styles.skeletonBlock} ${styles.skeletonButton}`} style={{ width: 140 }} />
      <div className={styles.questions}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} style={{ width: '40%' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} style={{ width: `${65 + i * 10}%` }} />
            <div className={styles.skeletonOptions}>
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className={`${styles.skeletonBlock} ${styles.skeletonOption}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  id: string;
}

type Phase = 'listening' | 'result';

export function ListeningExercisePage({ id }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();

  const { data, isLoading, error } = useQuery({
    queryKey: ['listening-exercise', id, lang],
    queryFn: () => listeningApi.getExercise(id),
  });

  const exercise = data?.exercise;

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const retryRef = useRef(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Exercise state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('listening');
  const [submitResult, setSubmitResult] = useState<Awaited<ReturnType<typeof listeningApi.submitAnswers>> | null>(null);

  const submitMutation = useMutation({
    mutationFn: (ans: Record<string, string>) => listeningApi.submitAnswers(id, ans),
    onSuccess: (result) => {
      setSubmitResult(result);
      setPhase('result');
      queryClient.invalidateQueries({ queryKey: ['listening-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['listening-exercise', id] });
    },
  });

  // Audio URL is always deterministic — load immediately, retry if not ready yet (background TTS).
  useEffect(() => {
    if (!exercise) return;

    retryRef.current = 0;
    setAudioReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const url = `/api/listening/exercises/${exercise.id}/audio`;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const mount = () => {
      if (destroyed) return;
      const a = new Audio(url);
      audioRef.current = a;
      a.addEventListener('canplaythrough', () => { if (!destroyed) setAudioReady(true); });
      a.addEventListener('error', () => {
        if (!destroyed && retryRef.current < 5) {
          retryRef.current++;
          retryTimer = setTimeout(mount, 3000);
        }
      });
      a.addEventListener('timeupdate', () => { if (!destroyed) setCurrentTime(a.currentTime); });
      a.addEventListener('durationchange', () => { if (!destroyed) setDuration(a.duration); });
      a.addEventListener('ended', () => { if (!destroyed) setIsPlaying(false); });
    };

    mount();

    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      audioRef.current?.pause();
    };
  }, [exercise?.id]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Skip ±N seconds, clamped to [0, duration]
  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.duration || duration || 0, audio.currentTime + delta));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  // Change playback speed and persist it onto the audio element
  const applyRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  // Re-apply current rate when audio element is (re)created
  useEffect(() => {
    if (audioReady && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [audioReady, playbackRate]);

  // Split transcript into sentences once. Sentence start times come from
  // exercise.sentenceTimestamps when available (real values aligned by
  // Whisper, ±100ms), or fall back to a word-weighted estimate based on
  // total duration. The fallback is still better than uniform division
  // because longer sentences take longer to read — but it's not exact.
  const sentences = useMemo(() => exercise ? splitSentences(exercise.transcript) : [], [exercise]);
  const sentenceTimes = useMemo(() => {
    if (!exercise || sentences.length === 0) return [] as number[];
    // Prefer real per-sentence timestamps if the backfill has populated them.
    const baked = exercise.sentenceTimestamps;
    if (Array.isArray(baked) && baked.length === sentences.length) {
      return baked.map((n) => Number(n));
    }
    // Fallback: word-weighted estimate against total duration.
    const total = duration || exercise.durationSec;
    const wordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length || 1);
    const totalWords = wordCounts.reduce((a, b) => a + b, 0);
    const out: number[] = [];
    let acc = 0;
    for (let i = 0; i < sentences.length; i++) {
      out.push((acc / totalWords) * total);
      acc += wordCounts[i] ?? 1;
    }
    return out;
  }, [sentences, duration, exercise]);
  // Tiny lead-in: jump 0.4s earlier than the estimate so we don't miss the
  // first syllable when the estimate is slightly late. With real Whisper
  // timestamps we keep a smaller 0.15s lead — they're already accurate.
  const JUMP_LEAD_SEC =
    Array.isArray(exercise?.sentenceTimestamps) ? 0.15 : 0.4;

  // Which sentence is currently being read (by clock position)
  const activeSentenceIdx = useMemo(() => {
    if (sentenceTimes.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < sentenceTimes.length; i++) {
      if (currentTime >= (sentenceTimes[i] ?? 0)) idx = i;
      else break;
    }
    return idx;
  }, [currentTime, sentenceTimes]);

  const jumpToSentence = (idx: number) => {
    const audio = audioRef.current;
    const t = sentenceTimes[idx];
    if (!audio || t === undefined) return;
    const target = Math.max(0, t - JUMP_LEAD_SEC);
    audio.currentTime = target;
    setCurrentTime(target);
    if (!isPlaying) {
      audio.play().catch(() => null);
      setIsPlaying(true);
    }
  };

  // ── Keyboard shortcuts: Space = play/pause, Left/Right = seek ±5s ──
  useEffect(() => {
    if (!audioReady) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); seekBy(-5); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seekBy(5);  }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady, isPlaying, duration]);

  const allAnswered = exercise ? exercise.questions.every((q) => answers[q.id]) : false;

  const handleSubmit = () => {
    if (!allAnswered) return;
    submitMutation.mutate(answers);
  };

  const handleRetry = () => {
    setAnswers({});
    setPhase('listening');
    setSubmitResult(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setShowTranscript(false);
  };

  if (isLoading) return <ExerciseSkeleton />;
  if (error || !exercise) return <div className={styles.loading}>{t.listening.notFound}</div>;

  if (phase === 'result' && submitResult) {
    return (
      <div className={styles.page}>
        <button className={styles.backButton} onClick={() => navigate({ to: '/listening' })}>
          <ArrowLeft size={16} />
          {t.listening.backToList}
        </button>

        <div className={styles.resultCard}>
          <div className={styles.resultScore}>
            <span className={styles.resultPercent}>{submitResult.score}%</span>
            <span className={styles.resultLabel}>
              {t.listening.resultCorrect
                .replace('{correct}', String(submitResult.correct))
                .replace('{total}', String(submitResult.total))}
            </span>
          </div>

          <div className={styles.resultAnswers}>
            {exercise.questions.map((q) => {
              const res = submitResult.results[q.id];
              return (
                <div key={q.id} className={`${styles.resultItem} ${res?.isCorrect ? styles.correct : styles.wrong}`}>
                  <div className={styles.resultItemIcon}>
                    {res?.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className={styles.resultItemText}>
                    <span className={styles.resultQuestion}>{q.text}</span>
                    <span className={styles.resultAnswer}>
                      {t.listening.yourAnswer} <strong>{answers[q.id] ?? '—'}</strong>
                      {!res?.isCorrect && (
                        <> → {t.listening.correctAnswer} <strong>{res?.correctAnswer}</strong></>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.resultActions}>
            <button className={styles.retryButton} onClick={handleRetry}>
              {t.listening.retry}
            </button>
            <button className={styles.backListButton} onClick={() => navigate({ to: '/listening' })}>
              {t.listening.backToListBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasAudio = audioReady;

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate({ to: '/listening' })}>
        <ArrowLeft size={16} />
        {t.listening.back}
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{exercise.title}</h1>
        <span className={styles.levelBadge}>{exercise.level}</span>
      </div>

      {/* Audio Player */}
      <div className={styles.player}>
        <div className={styles.playerTopRow}>
          <div className={styles.playerIcon}>
            <Volume2 size={20} />
          </div>
          <div className={styles.progressBar}>
            <input
              type="range"
              min={0}
              max={duration || exercise.durationSec}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className={styles.progressInput}
              disabled={!hasAudio}
              style={{ ['--progress' as string]: `${(currentTime / (duration || exercise.durationSec || 1)) * 100}%` }}
            />
            <div className={styles.progressTimes}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || exercise.durationSec)}</span>
            </div>
          </div>
        </div>

        <div className={styles.playerBottomRow}>
          <button
            className={styles.seekButton}
            onClick={() => seekBy(-5)}
            disabled={!hasAudio}
            aria-label="-5s"
          >
            <Rewind size={18} />
            <span>5s</span>
          </button>

          <button
            className={styles.playButton}
            onClick={togglePlay}
            disabled={!hasAudio}
          >
            {!hasAudio ? <div className={styles.loadingDot} /> : isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <button
            className={styles.seekButton}
            onClick={() => seekBy(5)}
            disabled={!hasAudio}
            aria-label="+5s"
          >
            <span>5s</span>
            <FastForward size={18} />
          </button>

          {/* Speed control */}
          <div className={styles.speedControl}>
            <span className={styles.speedLabel}>{t.listening.speedLabel}</span>
            <div className={styles.speedButtons}>
              {PLAYBACK_SPEEDS.map((rate) => (
                <button
                  key={rate}
                  className={`${styles.speedButton} ${playbackRate === rate ? styles.speedButtonActive : ''}`}
                  onClick={() => applyRate(rate)}
                  disabled={!hasAudio}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.keyboardHint}>{t.listening.keyboardHint}</div>
      </div>

      {/* Transcript Toggle */}
      <button
        className={styles.transcriptToggle}
        onClick={() => setShowTranscript(!showTranscript)}
      >
        {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showTranscript ? t.listening.hideTranscript : t.listening.showTranscript}
      </button>

      {showTranscript && (
        <div className={styles.transcript}>
          <div className={styles.transcriptHint}>{t.listening.jumpToHint}</div>
          {sentences.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.sentence} ${i === activeSentenceIdx ? styles.sentenceActive : ''}`}
              onClick={() => jumpToSentence(i)}
              disabled={!hasAudio}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className={styles.questions}>
        <h2 className={styles.questionsTitle}>{t.listening.questionsTitle}</h2>
        {exercise.questions.map((q, idx) => (
          <div key={q.id} className={styles.questionCard}>
            <p className={styles.questionText}>
              <span className={styles.questionNum}>{idx + 1}.</span> {q.text}
            </p>
            <div className={styles.options}>
              {q.options.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.option} ${answers[q.id] === opt ? styles.optionSelected : ''}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.submitButton}
        disabled={!allAnswered || submitMutation.isPending}
        onClick={handleSubmit}
      >
        {submitMutation.isPending ? t.listening.checking : t.listening.submit}
      </button>
    </div>
  );
}
