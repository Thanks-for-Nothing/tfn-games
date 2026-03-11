import React from 'react';
import { COLORS } from '../styles/theme';

interface ShipSVGProps {
  width?: number;
  height?: number;
}

export const GalleonSVG: React.FC<ShipSVGProps> = ({ width = 160, height = 40 }) => (
  <svg width={width} height={height} viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hull */}
    <path
      d="M10 28 Q15 36 40 38 L120 38 Q145 36 150 28 L145 22 Q140 18 130 18 L30 18 Q20 18 15 22 Z"
      fill={COLORS.leather}
      stroke={COLORS.darkGold}
      strokeWidth="1.5"
    />
    {/* Deck line */}
    <line x1="25" y1="22" x2="135" y2="22" stroke={COLORS.darkGold} strokeWidth="1" opacity="0.6" />
    {/* Mast 1 */}
    <line x1="50" y1="18" x2="50" y2="4" stroke={COLORS.leather} strokeWidth="2" />
    <polygon points="50,4 50,14 65,10" fill={COLORS.parchment} stroke={COLORS.lightParchment} strokeWidth="0.5" opacity="0.9" />
    {/* Mast 2 */}
    <line x1="85" y1="18" x2="85" y2="2" stroke={COLORS.leather} strokeWidth="2" />
    <polygon points="85,2 85,14 102,9" fill={COLORS.parchment} stroke={COLORS.lightParchment} strokeWidth="0.5" opacity="0.9" />
    {/* Mast 3 */}
    <line x1="115" y1="18" x2="115" y2="6" stroke={COLORS.leather} strokeWidth="1.5" />
    <polygon points="115,6 115,14 127,11" fill={COLORS.parchment} stroke={COLORS.lightParchment} strokeWidth="0.5" opacity="0.9" />
    {/* Bowsprit */}
    <line x1="15" y1="22" x2="5" y2="16" stroke={COLORS.leather} strokeWidth="1.5" />
    {/* Flag */}
    <rect x="83" y="1" width="8" height="5" rx="0.5" fill={COLORS.hit} opacity="0.8" />
  </svg>
);

export const BrigSVG: React.FC<ShipSVGProps> = ({ width = 120, height = 40 }) => (
  <svg width={width} height={height} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hull */}
    <path
      d="M8 28 Q12 36 30 38 L90 38 Q108 36 112 28 L108 22 Q104 18 95 18 L25 18 Q16 18 12 22 Z"
      fill={COLORS.leather}
      stroke={COLORS.darkGold}
      strokeWidth="1.5"
    />
    {/* Deck line */}
    <line x1="20" y1="22" x2="100" y2="22" stroke={COLORS.darkGold} strokeWidth="1" opacity="0.6" />
    {/* Mast 1 */}
    <line x1="42" y1="18" x2="42" y2="4" stroke={COLORS.leather} strokeWidth="2" />
    <polygon points="42,4 42,14 56,10" fill={COLORS.parchment} stroke={COLORS.lightParchment} strokeWidth="0.5" opacity="0.9" />
    {/* Mast 2 */}
    <line x1="78" y1="18" x2="78" y2="6" stroke={COLORS.leather} strokeWidth="1.5" />
    <polygon points="78,6 78,14 90,11" fill={COLORS.parchment} stroke={COLORS.lightParchment} strokeWidth="0.5" opacity="0.9" />
    {/* Bowsprit */}
    <line x1="12" y1="22" x2="3" y2="16" stroke={COLORS.leather} strokeWidth="1.5" />
    {/* Flag */}
    <rect x="40" y="2" width="7" height="4" rx="0.5" fill={COLORS.hit} opacity="0.8" />
  </svg>
);

export const DinghySVG: React.FC<ShipSVGProps> = ({ width = 80, height = 40 }) => (
  <svg width={width} height={height} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hull */}
    <path
      d="M8 28 Q12 36 25 38 L55 38 Q68 36 72 28 L68 24 Q64 20 58 20 L22 20 Q16 20 12 24 Z"
      fill={COLORS.leather}
      stroke={COLORS.darkGold}
      strokeWidth="1.5"
    />
    {/* Deck line */}
    <line x1="18" y1="24" x2="62" y2="24" stroke={COLORS.darkGold} strokeWidth="1" opacity="0.6" />
    {/* Oar left */}
    <line x1="30" y1="26" x2="18" y2="34" stroke={COLORS.leather} strokeWidth="1.5" />
    <ellipse cx="16" cy="35" rx="3" ry="1.5" fill={COLORS.leather} opacity="0.7" />
    {/* Oar right */}
    <line x1="50" y1="26" x2="62" y2="34" stroke={COLORS.leather} strokeWidth="1.5" />
    <ellipse cx="64" cy="35" rx="3" ry="1.5" fill={COLORS.leather} opacity="0.7" />
  </svg>
);
