import { Box, Text } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import theme from '../theme';

// Standard feature-link card. Replaces the ~150 lines of repeated
// `<Box as={Link}>` + border + hover + title + description markup across
// pages like UserDetails and Landing's "Discover" grids.
//
// Props:
//   to            react-router path (if omitted, renders a static Box)
//   accentColor   theme color string for title + hover border (required for
//                 the "primary" variant)
//   accentHover   optional color used on hover border; defaults to accent
//   title         bold label
//   description   secondary line
//   variant       'primary' → 2px colored border, bright title.
//                 'muted'   → 1px subtle border, lighter title. Used for
//                             secondary / discovery sections.
//
// Hover: subtle lift + border tint. Matches the per-feature coding used
// throughout the hub.

const FeatureCard = ({
  to,
  accentColor,
  accentHover,
  title,
  description,
  variant = 'primary',
  ...rest
}) => {
  const hoverBorder = accentHover || accentColor;
  const isMuted = variant === 'muted';

  return (
    <Box
      as={to ? Link : 'div'}
      to={to}
      bg={theme.colors.teal[800]}
      borderRadius="lg"
      border={isMuted ? '1px solid' : '2px solid'}
      borderColor={isMuted ? theme.colors.teal[600] : accentColor}
      p={5}
      _hover={{
        borderColor: hoverBorder,
        transform: 'translateY(-2px)',
      }}
      transition="all 0.15s"
      display="block"
      {...rest}
    >
      <Text
        fontWeight="bold"
        color={accentColor}
        mb={1}
        fontFamily={theme.fonts.heading}
        letterSpacing="-0.005em"
      >
        {title}
      </Text>
      <Text fontSize="sm" color="gray.400" lineHeight="1.55">
        {description}
      </Text>
    </Box>
  );
};

export default FeatureCard;
