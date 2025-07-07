import React, { useRef, useEffect, useState } from 'react';
import { COLORS, BORDER_RADIUS } from '../../shared/constants/slideConstants';

const MODES = [
  { label: 'Videos', value: 'videos', color: '#3B82F6' }, // blue
  { label: 'Memes', value: 'memes', color: '#F59E0B' }, // orange
  { label: 'Avatars', value: 'avatars', color: '#A855F7' }, // purple
  { label: 'Slides', value: 'slides', color: '#10B981' }, // green
  { label: 'Demo', value: 'hook-demo', color: '#F43F5E' }, // pink/red
];

export default function ModeToggle({
  modes = MODES,
  value,
  onChange,
  className = '',
}) {
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, color: modes[0].color, opacity: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // Only set hasInteracted to true after the first value change
    if (prevValue.current !== value) {
      setHasInteracted(true);
      prevValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeIdx = modes.findIndex((m) => m.value === value);
    const btns = container.querySelectorAll('button');
    if (btns[activeIdx]) {
      const btn = btns[activeIdx];
      setIndicator({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        color: modes[activeIdx].color,
        opacity: 1,
      });
    }
  }, [value, modes]);

  // Calculate even width for each button and indicator, with extra padding for pill
  const containerWidth = 600;
  const buttonCount = modes.length;
  const buttonWidth = containerWidth / buttonCount;
  const pillInset = 8; // px, space between pill and container edge
  const pillWidth = buttonWidth - pillInset * 2;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center shadow-md rounded-full ${className}`}
      style={{
        borderRadius: '9999px',
        background: 'rgba(255,255,255,0.25)',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        width: containerWidth,
        height: 84,
        padding: 0, // remove extra padding
        transition: 'background 0.2s',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated background pill */}
      <div
        className="absolute z-0"
        style={{
          top: 10,
          left: indicator.left + pillInset,
          width: pillWidth,
          height: 64,
          background: `linear-gradient(180deg, ${indicator.color}F2 0%, ${indicator.color}CC 100%)`,
          borderRadius: '9999px',
          boxShadow: `0 4px 24px 0 ${indicator.color}44, 0 0 0 3px ${indicator.color}33`,
          border: `2.5px solid ${indicator.color}88`,
          transition: hasInteracted ? 'left 0.7s cubic-bezier(.4,0,.2,1), background 0.32s, box-shadow 0.32s, border 0.32s' : 'none',
          opacity: indicator.opacity,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      {modes.map((mode, idx) => {
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`relative z-10 font-semibold focus:outline-none`}
            style={{
              background: 'transparent',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500,
              letterSpacing: '0.08em',
              width: buttonWidth,
              height: 64,
              fontSize: 20,
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flex: `0 0 ${buttonWidth}px`,
              paddingLeft: 0,
              paddingRight: 0,
              margin: 0,
            }}
            aria-pressed={isActive}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
} 