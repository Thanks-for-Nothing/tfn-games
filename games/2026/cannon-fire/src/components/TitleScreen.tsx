import React from 'react';
import { COLORS, FONTS } from '../styles/theme';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Full-screen hero background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${import.meta.env.BASE_URL}assets/hero-image.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.7) 100%)',
          zIndex: 1,
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          padding: '24px',
          animation: 'cannonfire-fadeIn 0.8s ease-out',
        }}
      >
        {/* Spacer — pushes button to bottom */}
        <div style={{ flex: 1 }} />

        {/* Bottom: Flavor text + Set Sail button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            paddingBottom: '16px',
          }}
        >
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 'clamp(13px, 3vw, 16px)',
              color: COLORS.parchment,
              textAlign: 'center',
              maxWidth: '280px',
              lineHeight: 1.5,
              textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            Sink the enemy fleet to claim yer treasure.
            <br />
            But beware — ye only get one chance!
          </p>

          <button
            onClick={onStart}
            style={{
              backgroundColor: COLORS.leather,
              color: COLORS.parchment,
              border: `2px solid ${COLORS.gold}`,
              borderRadius: '8px',
              padding: '16px 52px',
              fontFamily: FONTS.heading,
              fontSize: '26px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              boxShadow: `0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200, 168, 78, 0.3)`,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Set Sail
          </button>
        </div>
      </div>
    </div>
  );
};
