import React from 'react';
import { COLORS, FONTS } from '../styles/theme';

export const DefeatScreen: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px',
        background: `linear-gradient(180deg, #0a1520 0%, ${COLORS.darkNavy} 50%, #0a1520 100%)`,
        animation: 'cannonfire-fadeIn 0.8s ease-out',
        textAlign: 'center',
      }}
    >
      {/* Skull / defeat icon */}
      <div
        style={{
          marginBottom: '24px',
          opacity: 0.8,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke={COLORS.hit} strokeWidth="2" fill="rgba(204, 51, 0, 0.05)" />
          {/* Simple skull shape */}
          <ellipse cx="40" cy="34" rx="16" ry="18" fill={COLORS.lightParchment} opacity="0.8" />
          <circle cx="34" cy="31" r="4" fill={COLORS.darkNavy} />
          <circle cx="46" cy="31" r="4" fill={COLORS.darkNavy} />
          <ellipse cx="40" cy="39" rx="2" ry="3" fill={COLORS.darkNavy} />
          <rect x="33" y="50" width="3" height="8" rx="1" fill={COLORS.lightParchment} opacity="0.8" />
          <rect x="38.5" y="50" width="3" height="8" rx="1" fill={COLORS.lightParchment} opacity="0.8" />
          <rect x="44" y="50" width="3" height="8" rx="1" fill={COLORS.lightParchment} opacity="0.8" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: FONTS.heading,
          fontSize: 'clamp(48px, 14vw, 72px)',
          color: COLORS.hit,
          textShadow: `2px 2px 4px rgba(0,0,0,0.6), 0 0 20px rgba(204, 51, 0, 0.3)`,
          marginBottom: '24px',
          lineHeight: 1.2,
        }}
      >
        The sea claims
        <br />
        another soul...
      </h1>

      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 'clamp(28px, 7vw, 36px)',
          color: COLORS.lightParchment,
          opacity: 0.7,
          maxWidth: '280px',
          lineHeight: 1.6,
          marginBottom: '32px',
        }}
      >
        Yer fleet has been destroyed.
        <br />
        Better luck next time, matey.
      </p>

      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: '28px',
          color: COLORS.lightParchment,
          opacity: 0.4,
          fontStyle: 'italic',
        }}
      >
        TFN 2026 — Treasure Cove
      </p>
    </div>
  );
};
