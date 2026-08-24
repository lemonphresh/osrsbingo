import React from 'react';
import { Box, Icon } from '@chakra-ui/react';
import { FaHome } from 'react-icons/fa';
import { GiPumpkin, GiTombstone, GiGhost, GiHollowCat, GiCandyCanes } from 'react-icons/gi';
import {
  TILE_META,
  STATUS_META,
  stickerRotationDeg,
  STICKER_SHADOW,
  STICKER_SHADOW_HOVER,
  SPOOPY_COLORS,
} from './spoopyTheme';

// Placeholder icon components per tile type — swap for hand-drawn PNGs when
// they land. Assets will live at client/src/assets/spoopy/{type}.png.
const PLACEHOLDER_ICONS = {
  house:       FaHome,
  pumpkin:     GiPumpkin,
  grave:       GiTombstone,
  ghost:       GiGhost,
  'black-cat': GiHollowCat,
  candybag:    GiCandyCanes,
};

// Sticker-styled tile — used inside SpoopyBoard for each real tile position.
// Handles the six statuses + a hover lift + a deterministic rotation.
//
// Props:
//   tileType   'house' | 'pumpkin' | 'grave' | 'ghost' | 'black-cat' | 'candybag'
//   status     'locked' | 'unlocked' | 'submitted' | 'complete'  (defaults 'locked')
//   tileId     used to seed the rotation angle (stable across re-renders)
//   size       px, defaults 56
//   onClick    optional handler (should be a no-op for locked tiles)
//   assetSrc   optional PNG override; when provided, replaces the placeholder icon
export default function SpoopyTile({
  tileType,
  status = 'locked',
  tileId,
  size = 56,
  onClick,
  assetSrc,
  showLabel = false,
  ariaLabel,
}) {
  const meta = TILE_META[tileType] ?? TILE_META.house;
  const statusMeta = STATUS_META[status] ?? STATUS_META.locked;
  const IconComponent = PLACEHOLDER_ICONS[tileType] ?? FaHome;
  const rotation = stickerRotationDeg(tileId);
  const isInteractive = status !== 'locked' && typeof onClick === 'function';

  return (
    <Box
      as={isInteractive ? 'button' : 'div'}
      onClick={isInteractive ? onClick : undefined}
      aria-label={ariaLabel ?? `${meta.label}${status ? ` (${status})` : ''}`}
      title={ariaLabel ?? meta.label}
      position="relative"
      width={`${size}px`}
      height={`${size}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor={isInteractive ? 'pointer' : 'default'}
      opacity={statusMeta.opacity}
      filter={statusMeta.filter}
      transform={`rotate(${rotation}deg)`}
      transition="transform 120ms ease-out, box-shadow 120ms ease-out"
      _hover={
        isInteractive
          ? {
              transform: `rotate(${rotation}deg) translateY(-3px)`,
              boxShadow: STICKER_SHADOW_HOVER,
            }
          : undefined
      }
      // The white "sticker die-cut" backing + shadow
      bg={meta.stickerBg}
      borderRadius="md"
      border="3px solid"
      borderColor={SPOOPY_COLORS.paperEdge}
      boxShadow={STICKER_SHADOW}
      // Available/submitted/complete states get an outer status ring via outline
      outline="4px solid"
      outlineColor={statusMeta.ring}
      outlineOffset="0px"
    >
      {assetSrc ? (
        <img
          src={assetSrc}
          alt=""
          style={{
            width: '72%',
            height: '72%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <Icon
          as={IconComponent}
          boxSize={`${Math.floor(size * 0.6)}px`}
          color={meta.fillColor}
          aria-hidden="true"
        />
      )}

      {status === 'complete' && (
        <Box
          position="absolute"
          top="-6px"
          right="-6px"
          bg={SPOOPY_COLORS.green}
          color={SPOOPY_COLORS.paper}
          borderRadius="full"
          width="18px"
          height="18px"
          fontSize="12px"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border={`2px solid ${SPOOPY_COLORS.paper}`}
          transform={`rotate(${-rotation}deg)`}
        >
          ✓
        </Box>
      )}

      {status === 'submitted' && (
        <Box
          position="absolute"
          bottom="-6px"
          right="-6px"
          bg={SPOOPY_COLORS.purpleLight}
          color={SPOOPY_COLORS.paper}
          borderRadius="full"
          width="18px"
          height="18px"
          fontSize="10px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border={`2px solid ${SPOOPY_COLORS.paper}`}
          transform={`rotate(${-rotation}deg)`}
        >
          …
        </Box>
      )}

      {showLabel && (
        <Box
          position="absolute"
          bottom={`-${Math.floor(size * 0.3)}px`}
          left="50%"
          transform={`translateX(-50%) rotate(${-rotation}deg)`}
          fontSize="10px"
          fontWeight="600"
          color={SPOOPY_COLORS.paperInk}
          whiteSpace="nowrap"
          pointerEvents="none"
        >
          {meta.label}
        </Box>
      )}
    </Box>
  );
}
