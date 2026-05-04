import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Play, Pause, Volume2, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { listeningApi } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './ListeningExercisePage.module.css';

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
  const [showTranscript, setShowTranscript] = useState(false);

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

  // Wire up audio element whenever the exercise URL changes
  useEffect(() => {
    const url = exercise?.audioUrl;
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('durationchange', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.pause();
    };
  }, [exercise?.audioUrl]);

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

  const hasAudio = !!exercise.audioUrl;

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
        <div className={styles.playerIcon}>
          <Volume2 size={20} />
        </div>
        <div className={styles.playerControls}>
          <button
            className={styles.playButton}
            onClick={togglePlay}
            disabled={!hasAudio}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
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
            />
            <div className={styles.progressTimes}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || exercise.durationSec)}</span>
            </div>
          </div>
        </div>
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
          {exercise.transcript}
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
