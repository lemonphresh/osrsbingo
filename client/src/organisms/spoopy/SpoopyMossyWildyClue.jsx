import React from 'react';
import { Box, Image, Text, VStack } from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import wildy1 from '../../assets/spoopy/mossytiles/WILDY_1.png';
import wildy2 from '../../assets/spoopy/mossytiles/WILDY_2.png';
import wildy3 from '../../assets/spoopy/mossytiles/WILDY_3.png';
import wildy4 from '../../assets/spoopy/mossytiles/WILDY_4.png';
import wildy5 from '../../assets/spoopy/mossytiles/WILDY_5.png';
import wildy6 from '../../assets/spoopy/mossytiles/WILDY_6.png';
import wildy7 from '../../assets/spoopy/mossytiles/WILDY_7.png';
import wildy8 from '../../assets/spoopy/mossytiles/WILDY_8.png';
import wildy9 from '../../assets/spoopy/mossytiles/WILDY_9.png';
import wildy10 from '../../assets/spoopy/mossytiles/WILDY_10.png';
import wildy11 from '../../assets/spoopy/mossytiles/WILDY_11.png';
import wildy12 from '../../assets/spoopy/mossytiles/WILDY_12.png';

const CLUE_IMAGES = {
  1: wildy1,
  2: wildy2,
  3: wildy3,
  4: wildy4,
  5: wildy5,
  6: wildy6,
  7: wildy7,
  8: wildy8,
  9: wildy9,
  10: wildy10,
  11: wildy11,
  12: wildy12,
};

export default function SpoopyMossyWildyClue({ locationNumber }) {
  const image = CLUE_IMAGES[locationNumber];
  if (!image) return null;

  return (
    <Box
      border="3px solid"
      borderColor={SPOOPY_COLORS.ember}
      borderRadius="md"
      bg={SPOOPY_COLORS.night}
      color={SPOOPY_COLORS.paper}
      p={3}
      boxShadow={`4px 4px 0 ${SPOOPY_COLORS.paperShadow}`}
    >
      <VStack align="stretch" spacing={3}>
        <Box>
          <Text
            fontFamily={SPOOPY_FONTS.heading}
            color={SPOOPY_COLORS.slime}
            fontSize="md"
            letterSpacing="wide"
          >
            mossy's spoopy selfie
          </Text>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="xs" opacity={0.8} mt={1}>
            identify this location, then follow the task instructions above
          </Text>
        </Box>
        <Image
          src={image}
          alt="Your team's wilderness location clue"
          width="100%"
          maxH="420px"
          objectFit="contain"
          border="2px solid"
          borderColor={SPOOPY_COLORS.paperEdge}
          borderRadius="sm"
          bg="#000"
        />
      </VStack>
    </Box>
  );
}
