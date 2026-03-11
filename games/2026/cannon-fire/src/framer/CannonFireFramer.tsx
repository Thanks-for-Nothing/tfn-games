// Framer Code Component Wrapper for Cannon Fire
//
// To use in Framer:
// 1. Create a new Code Component in Framer
// 2. Copy the contents of the bundled single-file version into the code editor
// 3. Use the property controls to set hero image, logo, and background texture
//
// For standalone deployment, use the built version from `npm run build`

import React from 'react';
import { CannonFire } from '../components/CannonFire';

interface CannonFireFramerProps {
  heroImage?: string;
  logoImage?: string;
  bgTexture?: string;
  style?: React.CSSProperties;
}

const CannonFireFramer: React.FC<CannonFireFramerProps> = (props) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...props.style,
      }}
    >
      <CannonFire />
    </div>
  );
};

export default CannonFireFramer;

// Note: In Framer, you would add property controls like this:
// import { addPropertyControls, ControlType } from "framer"
//
// addPropertyControls(CannonFireFramer, {
//   heroImage: {
//     type: ControlType.Image,
//     title: "Hero Image",
//   },
//   logoImage: {
//     type: ControlType.Image,
//     title: "TFN Logo",
//   },
//   bgTexture: {
//     type: ControlType.Image,
//     title: "Background Texture",
//   },
// })
