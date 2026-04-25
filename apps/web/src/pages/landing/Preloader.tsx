import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import foxIcon from './fox-icon.png';
import styles from './Preloader.module.css';

const LETTERS = 'FrenchUp'.split('');

interface PreloaderProps {
  onDone: () => void;
}

export function Preloader({ onDone }: PreloaderProps) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 1800);
    const t2 = setTimeout(() => setShow(false), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    // onExitComplete вызывается когда exit-анимация overlay завершена
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <motion.div
            className={styles.content}
            animate={phase === 'out' ? { scale: 0.78, opacity: 0, y: -24 } : {}}
            transition={{ duration: 0.38, ease: [0.4, 0, 1, 1] }}
          >
            {/* Fox */}
            <motion.img
              src={foxIcon}
              className={styles.fox}
              alt="FrenchUp"
              initial={{ y: 60, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.65, type: 'spring', bounce: 0.45 }}
            />

            {/* Letters */}
            <div className={styles.wordRow} aria-label="FrenchUp">
              {LETTERS.map((char, i) => (
                <motion.span
                  key={i}
                  className={styles.letter}
                  initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Subtitle */}
            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.85 }}
            >
              Учи французский с умом
            </motion.p>

            {/* Progress bar */}
            <div className={styles.progressTrack}>
              <motion.div
                className={styles.progressBar}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
