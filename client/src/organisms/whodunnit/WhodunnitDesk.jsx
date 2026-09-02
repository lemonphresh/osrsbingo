import React from 'react';
import { Box } from '@chakra-ui/react';
import { WD_COLORS } from './whodunnitTheme';
import leatherTextureAsset from '../../assets/spoopy/leather.webp';

// Full-page background: dark oiled-brown leather blotter. Reuses spoopy's
// leather texture asset with a warm brown base + slightly heavier grain.
// All whodunnit pages wrap their content in this.
const WhodunnitDesk = ({ children }) => (
  <Box
    minHeight="calc(100vh - 60px)"
    bg={WD_COLORS.desk}
    color={WD_COLORS.paper}
    position="relative"
    _before={{
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: `url(${leatherTextureAsset})`,
      backgroundRepeat: 'repeat',
      backgroundSize: '480px',
      opacity: 0.28,
      pointerEvents: 'none',
      zIndex: 0,
      // Warm sepia tone rather than the spoopy purple
      filter: 'sepia(0.7) hue-rotate(-15deg)',
    }}
    // Soft vignette at the corners — worn leather edges
    _after={{
      content: '""',
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    <Box position="relative" zIndex={1}>
      {children}
    </Box>
  </Box>
);

export default WhodunnitDesk;
