import { Box, Text, VStack } from '@chakra-ui/react';

/**
 * Shared champion sprite component.
 * The sprite faces RIGHT by default. Pass side="left" to mirror for the left-side battle slot.
 *
 * Layered pixel art:
 *   - All sprite PNGs (base + equipment) must be the SAME canvas size (e.g. 32×64 or 48×96).
 *   - Equipment PNGs are fully transparent except where the item appears on the body.
 *   - Pass `layers` as an ordered array of src strings: base first, then equipment in draw order.
 *   - Recommended layer order: base → cape → boots → legs → chest → gloves → shield → helm → weapon
 *
 * Props:
 *   src         string    — base character sprite PNG
 *   layers      string[]  — additional sprite PNGs composited on top of base (equipment, etc.)
 *   side        'left' | 'right'  — 'left' mirrors the whole composite horizontally
 *   size        number    — box height base in px; width = size*0.75, height = size*2. Default 96.
 *                           Aseprite canvas: 48×64 px (3:4 ratio). Character in center 16px,
 *                           weapon in right 16px, shield in left 16px.
 *   color       string    — accent / border / glow color. Default '#888'.
 *   name        string    — optional label below sprite
 *   hasBorder   bool      — show the colored border box. Default true.
 *   isShaking   bool      — brief shake on hit
 *   isFlashing  bool      — brightness flash on hit
 *   isDead      bool      — grayscale + dim
 */
export default function ChampionSprite({
  src,
  backLayers = [],
  layers = [],
  facing = 'right',
  size = 96,
  color = '#888',
  name,
  hasBorder = true,
  isShaking = false,
  isFlashing = false,
  isDead = false,
}) {
  const mirror = facing === 'left';

  const transforms = [];
  if (mirror) transforms.push('scaleX(-1)');
  if (isShaking) transforms.push('translateX(8px)');

  const filter = isFlashing ? 'brightness(3)' : isDead ? 'grayscale(1) opacity(0.4)' : 'none';

  const imgStyle = {
    imageRendering: 'pixelated',
    objectFit: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const hasSprite = src || layers.length > 0;

  return (
    <VStack spacing={1} align="center">
      <Box
        w={`${Math.round(size * 1.5)}px`}
        h={`${size * 2.25}px`}
        borderRadius="20%"
        bg={`${color}22`}
        border={hasBorder ? `2px solid ${color}` : undefined}
        my={3}
        mx={10}
        position="relative"
        overflow="hidden"
        boxShadow={`0 0 20px ${color}44`}
        transform={transforms.length ? transforms.join(' ') : 'none'}
        filter={filter}
        transition="transform 0.1s, filter 0.1s"
        userSelect="none"
      >
        {hasSprite ? (
          <>
            {backLayers.map((layerSrc, i) => (
              <Box key={`back-${i}`} as="img" src={layerSrc} alt="" style={imgStyle} />
            ))}
            {src && <Box as="img" src={src} alt="" style={imgStyle} />}
            {layers.map((layerSrc, i) => (
              <Box key={i} as="img" src={layerSrc} alt="" style={imgStyle} />
            ))}
          </>
        ) : (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            fontSize={`${Math.round(size * 0.5)}px`}
          >
            {isDead ? '💀' : '🧙'}
          </Box>
        )}
      </Box>
    </VStack>
  );
}
