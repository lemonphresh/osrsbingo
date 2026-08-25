import React from 'react';
import { Box, Icon } from '@chakra-ui/react';
import { FaHome, FaCamera } from 'react-icons/fa';
import { GiPumpkin, GiTombstone, GiGhost, GiHollowCat, GiSpookyHouse } from 'react-icons/gi';
import {
  TILE_META,
  STATUS_META,
  stickerRotationDeg,
  STICKER_SHADOW,
  STICKER_SHADOW_HOVER,
  SPOOPY_COLORS,
} from './spoopyTheme';

import houseAsset from '../../assets/spoopy/house.webp';
import pumpkinAsset from '../../assets/spoopy/pumpkin.webp';
import graveAsset from '../../assets/spoopy/grave.webp';
import ghostAsset from '../../assets/spoopy/ghost.webp';
import blackCatAsset from '../../assets/spoopy/black_cat.webp';

// Hand-drawn paper-sticker assets per tile type. Types without an entry here
// fall back to the react-icons placeholder below. Candybag deliberately keeps
// the GiSpookyHouse icon — bag_of_sweets.webp is reserved for the "candy
// shower" flourish that plays when a team engages with the scary castle.
const TILE_ASSETS = {
  house: houseAsset,
  pumpkin: pumpkinAsset,
  grave: graveAsset,
  ghost: ghostAsset,
  'black-cat': blackCatAsset,
};

const PLACEHOLDER_ICONS = {
  start: FaCamera,
  house: FaHome,
  pumpkin: GiPumpkin,
  grave: GiTombstone,
  ghost: GiGhost,
  'black-cat': GiHollowCat,
  candybag: GiSpookyHouse,
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
  progress = 0,
}) {
  const meta = TILE_META[tileType] ?? TILE_META.house;
  const statusMeta = STATUS_META[status] ?? STATUS_META.locked;
  const IconComponent = PLACEHOLDER_ICONS[tileType] ?? FaHome;
  const resolvedAsset = assetSrc ?? TILE_ASSETS[tileType] ?? null;
  const rotation = stickerRotationDeg(tileId);
  const isInteractive = status !== 'locked' && typeof onClick === 'function';
  const clampedProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const showProgress =
    clampedProgress > 0 &&
    clampedProgress < 100 &&
    (status === 'unlocked' || status === 'submitted');

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
      {resolvedAsset ? (
        <img
          src={resolvedAsset}
          alt=""
          style={{
            width: '85%',
            height: '85%',
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

      {showProgress && (
        <Box
          position="absolute"
          top={`-${Math.max(16, Math.floor(size * 0.14))}px`}
          left="50%"
          transform="translateX(-50%)"
          width={`${Math.floor(size * 0.7)}px`}
          height="4px"
          borderRadius="full"
          bg={SPOOPY_COLORS.nightMist}
          border={`1px solid ${SPOOPY_COLORS.paperEdge}`}
          overflow="hidden"
          pointerEvents="none"
          aria-hidden="true"
        >
          <Box
            width={`${clampedProgress}%`}
            height="100%"
            bg={SPOOPY_COLORS.pumpkin}
            transition="width 200ms ease-out"
          />
        </Box>
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
