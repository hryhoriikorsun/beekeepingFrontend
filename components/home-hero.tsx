'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { preload } from 'react-dom';
import { ArrowDownIcon, PauseIcon, PlayIcon } from './icons';

/// Played in this order and round again: the apiary, the bees at work, the
/// honey, the table, the wax.
const CLIPS = [
  '/videos/previews/vulyky-v-sadu.mp4',
  '/videos/previews/vulyk-na-sontsi.mp4',
  '/videos/previews/vulyk-i-med.mp4',
  '/videos/previews/med-na-stoli.mp4',
  '/videos/previews/svichka.mp4',
];

/// First frame of the first clip: what the hero shows while that clip is on
/// its way, and all it shows to anyone who asked for less motion. Every clip
/// has one beside it (scripts/encode-hero-videos.mjs), so any order works.
const POSTER = CLIPS[0].replace(/\.mp4$/, '.webp');

const FADE_MS = 1400;
const CALM = '(prefers-reduced-motion: reduce)';

function subscribeToCalm(onChange: () => void) {
  const query = window.matchMedia(CALM);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/// A moving background nobody started is exactly what reduced motion and
/// data saver opt out of.
function mayAutoplay() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !window.matchMedia(CALM).matches && !connection?.saveData;
}

/**
 * Full-bleed band of short clips that crossfade into one another, with the
 * page's own copy laid over them. Only the clip on screen and the one after
 * it are ever downloaded, and nothing plays while the band is scrolled away.
 */
export function HomeHero({ children }: { children: React.ReactNode }) {
  preload(POSTER, { as: 'image', fetchPriority: 'high' });

  const root = useRef<HTMLElement>(null);
  const clips = useRef<(HTMLVideoElement | null)[]>([]);
  const dots = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  // null until the visitor presses the button; their choice beats the default.
  const [choice, setChoice] = useState<boolean | null>(null);
  const autoplay = useSyncExternalStore(subscribeToCalm, mayAutoplay, () => true);
  const playing = choice ?? autoplay;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const all = clips.current;
    const current = all[active];
    const nextIndex = (active + 1) % CLIPS.length;
    const next = all[nextIndex];
    if (!current || !next) return;

    if (!playing || !onScreen) {
      all.forEach((clip) => clip?.pause());
      return;
    }

    // React applies `muted` only as a property after hydration, and browsers
    // autoplay nothing that is not muted, so playback starts here rather
    // than through the autoPlay attribute.
    current.muted = true;
    current.play().catch((error: DOMException) => {
      // iOS in low-power mode refuses autoplay; the button is the way in.
      if (error.name === 'NotAllowedError') setChoice(false);
    });

    if (next.preload !== 'auto') {
      next.preload = 'auto';
      next.load();
    }

    const start = () => {
      next.currentTime = 0;
      next.muted = true;
      next.play().catch(() => {});
      dots.current?.style.setProperty('--progress', '0');
      setLeaving(active);
      setActive(nextIndex);
    };

    let handedOver = false;
    const handOver = () => {
      if (handedOver) return;
      handedOver = true;
      // A clip still downloading would stutter mid-fade; until it can play,
      // the current one simply holds its last frame.
      if (next.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) start();
      else next.addEventListener('canplay', start, { once: true });
    };

    const onTime = () => {
      if (!current.duration) return;
      dots.current?.style.setProperty('--progress', String(current.currentTime / current.duration));
      if (current.duration - current.currentTime <= FADE_MS / 1000) handOver();
    };

    current.addEventListener('timeupdate', onTime);
    current.addEventListener('ended', handOver);
    return () => {
      current.removeEventListener('timeupdate', onTime);
      current.removeEventListener('ended', handOver);
      next.removeEventListener('canplay', start);
    };
  }, [active, playing, onScreen]);

  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(() => {
      clips.current[leaving]?.pause();
      setLeaving(null);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  return (
    <section
      ref={root}
      className="home-hero"
      style={{ '--hero-fade': `${FADE_MS}ms` } as React.CSSProperties}
    >
      <div className="hero-media" aria-hidden="true">
        {CLIPS.map((src, i) => (
          <video
            key={src}
            ref={(el) => {
              clips.current[i] = el;
            }}
            className={`hero-clip${i === active ? ' is-active' : ''}${i === leaving ? ' is-leaving' : ''}`}
            src={src}
            poster={i === 0 ? POSTER : undefined}
            preload={i === 0 ? 'auto' : 'none'}
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
          />
        ))}
      </div>

      <div className="hero-inner">
        <div className="hero-copy">{children}</div>

        <div className="hero-controls">
          <div ref={dots} className="hero-dots" aria-hidden="true">
            {CLIPS.map((src, i) => (
              <span key={src} className={`hero-dot${i === active ? ' is-active' : ''}`} />
            ))}
          </div>
          <button
            type="button"
            className="hero-toggle"
            aria-label={playing ? 'Зупинити відео' : 'Увімкнути відео'}
            onClick={() => setChoice(!playing)}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>
    </section>
  );
}

/// Sets data-greeting on the target the moment the glide starts, so the
/// target's own animation plays out alongside the scroll rather than after
/// it. Cleared and set again on every click, so it replays each time.
function greet(target: HTMLElement) {
  target.removeAttribute('data-greeting');
  // Flushes styles between the two, or the browser sees no change and the
  // animations do not restart.
  void target.offsetWidth;
  target.setAttribute('data-greeting', '');
}

/// A plain anchor, so it works before hydration too; once React is in, the
/// jump becomes a glide for everyone who did not ask for less motion.
export function ScrollDownLink({
  targetId,
  children,
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className="btn btn-primary hero-cta"
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        const calm = window.matchMedia(CALM).matches;
        greet(target);
        target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        // Moves the keyboard to where the eyes went, as the anchor would have.
        target.focus({ preventScroll: true });
      }}
    >
      {children}
      <ArrowDownIcon className="hero-cta-arrow" />
    </a>
  );
}
