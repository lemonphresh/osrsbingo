import React from 'react';
import { Box, Icon } from '@chakra-ui/react';
import { WAX_SEAL_SX, WD_FONTS } from './whodunnitTheme';

// A Watson-stamped wax seal with a holiday ribbon peeking out from
// underneath. The ribbon is a small pointed-tail rectangle behind the seal;
// only its bottom portion is visible below the wax, showing a react-icon
// (snowman, tree, present, candy cane, etc). Watson stamps every clue with
// a little seasonal flair — it's on brand.
//
// Props:
//   label      - short text in the seal (i.e. "CONF", "042")
//   icon       - react-icons component (i.e. GiChristmasTree)
//   size       - width/height of the seal, px (default 76)
//   rotate     - seal rotation, deg (default -8)
//   ribbonColor - hex for the ribbon body (default deep pine green)
//   ribbonTrim  - hex for the ribbon side highlight (default gold)
//   iconColor   - hex for the icon (default cream)
const WaxSeal = ({
  label,
  icon: IconComponent,
  size = 76,
  rotate = -8,
  ribbonColor = '#1e5a2b',
  ribbonTrim = '#c9a04c',
  iconColor = '#f4ead0',
}) => {
  // Geometry:
  //   behindAmount = how much of the ribbon is hidden behind the seal
  //   peekAmount   = how much extends BELOW the seal's bottom edge
  //   ribbonHeight = behind + peek (total)
  //   ribbonTop    = distance from container top to ribbon top
  //
  // Bigger peek + bigger width so the icon is legibly visible.
  const behindAmount = Math.round(size * 0.28);
  const peekAmount = Math.round(size * 0.7);
  const ribbonWidth = Math.round(size * 0.68);
  const ribbonHeight = behindAmount + peekAmount;
  const ribbonTop = size - behindAmount;
  const iconSize = Math.round(size * 0.4);
  // Push icon up from ribbon bottom just enough to clear the V-notch tail.
  const iconBottomPad = Math.round(ribbonHeight * 0.28);
  const clipPath = 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)';

  return (
    <Box position="relative" display="inline-block" width={`${size}px`} height={`${size}px`}>
      {IconComponent && (
        <Box
          position="absolute"
          left="50%"
          top={`${ribbonTop}px`}
          transform={`translateX(-50%) rotate(${rotate + 6}deg)`}
          transformOrigin="top center"
          width={`${ribbonWidth}px`}
          height={`${ribbonHeight}px`}
          bg={ribbonColor}
          zIndex={0}
          sx={{ clipPath }}
          filter="drop-shadow(0 5px 8px rgba(0,0,0,0.55))"
          display="flex"
          alignItems="flex-end"
          justifyContent="center"
          pb={`${iconBottomPad}px`}
        >
          {/* Ribbon gold trim on the sides */}
          <Box
            position="absolute"
            left="10%"
            top="0"
            bottom="18%"
            width="2px"
            bg={ribbonTrim}
            opacity={0.85}
          />
          <Box
            position="absolute"
            right="10%"
            top="0"
            bottom="18%"
            width="2px"
            bg={ribbonTrim}
            opacity={0.85}
          />
          {/* Subtle darker inner shadow for fabric depth — kept light so
              it doesn't muddy the icon. */}
          <Box
            position="absolute"
            inset={0}
            sx={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
              clipPath,
            }}
            pointerEvents="none"
          />
          <Icon
            as={IconComponent}
            boxSize={`${iconSize}px`}
            color={iconColor}
            style={{
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
            }}
          />
        </Box>
      )}

      {/* The wax seal on top of the ribbon */}
      <Box
        sx={{
          ...WAX_SEAL_SX,
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotate(${rotate}deg)`,
        }}
        style={{
          // Local overrides so a per-instance rotate prop doesn't get
          // clobbered by the shared sx transform.
          position: 'relative',
          zIndex: 1,
          fontFamily: WD_FONTS.typewriter,
        }}
      >
        {label}
      </Box>
    </Box>
  );
};

export default WaxSeal;
