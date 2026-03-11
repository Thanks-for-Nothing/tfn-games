import React from 'react';
import type { Orientation } from '../game/types';
import { GalleonSVG, BrigSVG, DinghySVG } from '../assets/ships';

interface ShipSilhouetteProps {
  shipId: string;
  size: number;
  orientation: Orientation;
  cellSize?: number;
}

export const ShipSilhouette: React.FC<ShipSilhouetteProps> = ({
  shipId,
  size,
  orientation,
  cellSize = 40,
}) => {
  const width = cellSize * size;
  const height = cellSize;

  const renderShip = () => {
    switch (shipId) {
      case 'galleon':
        return <GalleonSVG width={width} height={height} />;
      case 'brig':
        return <BrigSVG width={width} height={height} />;
      case 'dinghy':
        return <DinghySVG width={width} height={height} />;
      default:
        return <GalleonSVG width={width} height={height} />;
    }
  };

  const containerStyle: React.CSSProperties = {
    width: orientation === 'horizontal' ? width : height,
    height: orientation === 'horizontal' ? height : width,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const innerStyle: React.CSSProperties =
    orientation === 'vertical'
      ? {
          transform: 'rotate(90deg)',
          transformOrigin: 'center center',
          width: width,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      : {
          width: width,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>{renderShip()}</div>
    </div>
  );
};
