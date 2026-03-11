import React from 'react';
import { COLORS, FONTS } from '../styles/theme';

export const VictoryScreen: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px',
        background: `linear-gradient(180deg, ${COLORS.darkNavy} 0%, #1a2a1a 50%, ${COLORS.darkNavy} 100%)`,
        animation: 'cannonfire-fadeIn 0.8s ease-out',
        textAlign: 'center',
      }}
    >
      {/* Victory icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: '24px',
          animation: 'cannonfire-float 3s ease-in-out infinite',
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke={COLORS.gold} strokeWidth="3" fill="rgba(200, 168, 78, 0.1)" />
          <path
            d="M40 15 L45 30 L60 30 L48 40 L52 55 L40 46 L28 55 L32 40 L20 30 L35 30 Z"
            fill={COLORS.gold}
            stroke={COLORS.darkGold}
            strokeWidth="1"
          />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: FONTS.heading,
          fontSize: 'clamp(32px, 9vw, 48px)',
          color: COLORS.gold,
          textShadow: `2px 2px 4px rgba(0,0,0,0.6), 0 0 30px rgba(200, 168, 78, 0.4)`,
          marginBottom: '16px',
          lineHeight: 1.1,
        }}
      >
        You Win!
      </h1>

      <div
        style={{
          backgroundColor: 'rgba(200, 168, 78, 0.1)',
          border: `2px solid ${COLORS.gold}`,
          borderRadius: '12px',
          padding: '24px 32px',
          maxWidth: '320px',
          marginBottom: '24px',
        }}
      >
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(16px, 4vw, 20px)',
            color: COLORS.parchment,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Show this screen to the
          <br />
          <span
            style={{
              color: COLORS.gold,
              fontFamily: FONTS.heading,
              fontSize: 'clamp(20px, 5vw, 26px)',
            }}
          >
            Game Master
          </span>
          <br />
          to claim your treasure!
        </p>
      </div>

      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: '14px',
          color: COLORS.lightParchment,
          opacity: 0.6,
          fontStyle: 'italic',
        }}
      >
        TFN 2026 — Treasure Cove
      </p>
    </div>
  );
};
