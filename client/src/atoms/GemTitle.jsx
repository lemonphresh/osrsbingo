import { Box, Flex, Heading, Image } from '@chakra-ui/react';
import React from 'react';
import EternalGem from '../assets/gemoji.png';
import theme from '../theme';

// Site-wide heading atom: two gems flanking a title with a small cluster
// of diamond-shaped divider dots underneath. The diamonds echo the gem
// silhouettes so the accent belongs to the composition rather than being
// bolted on. Replaces the earlier skewed brushstroke highlight.
//
// API is the original three props: `size` (sm | md | lg), `gemColor`
// (default | blue | purple | green | orange), and `color` on the heading.
// Everything else is forwarded to the outer <Flex>.

const SIZE_TOKENS = {
  sm: {
    fontSize: ['16px', '18px', '20px'],
    iconHW: ['16px', '18px'],
    pad: 7,
    dotSm: '4px',
    dotMd: '6px',
    dotGap: '7px',
    ruleW: '28px',
  },
  md: {
    fontSize: ['24px', '28px', '32px'],
    iconHW: ['22px', '26px'],
    pad: 9,
    dotSm: '5px',
    dotMd: '7px',
    dotGap: '9px',
    ruleW: '40px',
  },
  lg: {
    fontSize: ['32px', '36px', '40px'],
    iconHW: ['28px', '34px'],
    pad: 11,
    dotSm: '6px',
    dotMd: '9px',
    dotGap: '11px',
    ruleW: '52px',
  },
};

const COLOR_FILTERS = {
  default: null,
  blue: 'hue-rotate(40deg)',
  purple: 'hue-rotate(120deg)',
  green: 'hue-rotate(300deg)',
  orange: 'hue-rotate(180deg)',
};

// Three small diamonds flanked by two short hairline rules that fade to
// transparent at the outer edges. Reads as an ornamental divider rather
// than floating dots. Positioned absolutely so the title text keeps its
// natural width and the whole divider centers underneath it.
function DiamondDots({ color, dotSm, dotMd, gap, ruleW }) {
  const Dot = ({ s }) => (
    <Box
      aria-hidden
      w={s}
      h={s}
      bg={color}
      opacity={0.85}
      transform="rotate(45deg)"
      boxShadow={`0 0 5px ${color}55`}
      flexShrink={0}
    />
  );
  const Rule = ({ dir }) => (
    <Box
      aria-hidden
      h="1px"
      w={ruleW}
      flexShrink={0}
      bgGradient={
        dir === 'left'
          ? `linear(to-r, transparent, ${color})`
          : `linear(to-r, ${color}, transparent)`
      }
      opacity={0.55}
    />
  );
  return (
    <Flex
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      justify="center"
      align="center"
      gap={gap}
      pointerEvents="none"
    >
      <Rule dir="left" />
      <Dot s={dotSm} />
      <Dot s={dotMd} />
      <Dot s={dotSm} />
      <Rule dir="right" />
    </Flex>
  );
}

const GemTitle = ({ children, gemColor = 'default', size = 'md', ...props }) => {
  const tokens = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const imgFilter = COLOR_FILTERS[gemColor] ?? null;
  const accent =
    gemColor !== 'default' ? theme.colors[gemColor][300] : theme.colors.pink[300];
  // Soft colored halo under each gem so they feel like glowing stones.
  const gemGlow = `0 0 12px ${accent}55`;

  return (
    <Flex alignItems="flex-start" justifyContent="center" marginBottom="16px" {...props}>
      <Image
        aria-hidden
        height={tokens.iconHW}
        marginRight="12px"
        src={EternalGem}
        transform="scaleX(-1)"
        width={tokens.iconHW}
        sx={{ filter: `${imgFilter ?? ''} drop-shadow(${gemGlow})` }}
      />
      <Box position="relative" paddingBottom={`${tokens.pad}px`}>
        <Heading
          color={props.color ? props.color : theme.colors.white}
          fontSize={tokens.fontSize}
          fontFamily={theme.fonts.heading}
          fontWeight="700"
          letterSpacing="-0.015em"
          wordBreak="break-word"
          position="relative"
          width="fit-content"
        >
          {children}
        </Heading>
        <DiamondDots
          color={accent}
          dotSm={tokens.dotSm}
          dotMd={tokens.dotMd}
          gap={tokens.dotGap}
          ruleW={tokens.ruleW}
        />
      </Box>
      <Image
        aria-hidden
        height={tokens.iconHW}
        marginLeft="12px"
        src={EternalGem}
        width={tokens.iconHW}
        sx={{ filter: `${imgFilter ?? ''} drop-shadow(${gemGlow})` }}
      />
    </Flex>
  );
};

export default GemTitle;
