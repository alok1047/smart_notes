import { useReducedMotion } from 'framer-motion';
import './WalkingDog.css';

/* ------------------------------------------------------------------ */
/* A cute minimal SVG dog that walks across the screen, stops in the   */
/* middle to wag its tail, then continues walking off-screen.          */
/* Pure CSS animation — no external assets.                            */
/* ------------------------------------------------------------------ */

const WalkingDog = () => {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className="walking-dog-track" aria-hidden>
      <div className="walking-dog">
        <svg
          viewBox="0 0 64 40"
          fill="none"
          className="walking-dog-svg"
        >
          {/* Tail */}
          <g className="dog-tail" style={{ transformOrigin: '14px 14px' }}>
            <path
              d="M14 14c-4-2-8-6-10-10"
              stroke="var(--text)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Body */}
          <ellipse cx="28" cy="18" rx="16" ry="11" fill="var(--pastel-yellow)" stroke="var(--text)" strokeWidth="2" />

          {/* Spot on body */}
          <ellipse cx="24" cy="16" rx="5" ry="4" fill="var(--pastel-peach)" opacity="0.6" />

          {/* Head */}
          <circle cx="46" cy="12" r="9" fill="var(--pastel-yellow)" stroke="var(--text)" strokeWidth="2" />

          {/* Ear */}
          <path
            d="M40 6c-2-4-1-7 2-7 2 0 3 2 2 5"
            fill="var(--pastel-peach)"
            stroke="var(--text)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Eye */}
          <circle cx="48" cy="11" r="1.8" fill="var(--text)" />
          {/* Eye shine */}
          <circle cx="48.8" cy="10.3" r="0.6" fill="var(--bg)" />

          {/* Nose */}
          <ellipse cx="54" cy="13" rx="2" ry="1.5" fill="var(--text)" />

          {/* Mouth */}
          <path d="M52 15.5c1 1 2.5 1 3 0" stroke="var(--text)" strokeWidth="1.2" strokeLinecap="round" fill="none" />

          {/* Tongue (visible during panting/stop) */}
          <path
            className="dog-tongue"
            d="M53.5 15.5c0 1.5-0.5 3-1 3.5"
            stroke="#F28B82"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Front legs */}
          <g className="dog-front-legs">
            <line x1="36" y1="27" x2="37" y2="36" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="40" y1="27" x2="41" y2="36" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Back legs */}
          <g className="dog-back-legs">
            <line x1="18" y1="27" x2="17" y2="36" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="22" y1="27" x2="21" y2="36" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Paw dots */}
          <g className="dog-front-legs">
            <circle cx="37" cy="37" r="1.5" fill="var(--text)" />
            <circle cx="41" cy="37" r="1.5" fill="var(--text)" />
          </g>
          <g className="dog-back-legs">
            <circle cx="17" cy="37" r="1.5" fill="var(--text)" />
            <circle cx="21" cy="37" r="1.5" fill="var(--text)" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default WalkingDog;
