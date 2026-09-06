import React from 'react';
import { Box, HStack, VStack, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// Header block shown on every page while inside a campaign. The team's
// "detective agency" name is the big serif heading; a typewriter-style
// caption underneath lists each member's RSN, comma-separated.
const CampaignHeader = ({ campaign, subtitle }) => {
  const members = campaign?.members || [];
  const rsns = members
    .map((m) => m.user?.rsn || m.user?.username || null)
    .filter(Boolean);

  return (
    <Box
      pt={6}
      pb={4}
      px={6}
      borderBottom="1px solid"
      borderColor="rgba(0,0,0,0.4)"
      bg="rgba(0,0,0,0.15)"
    >
      <VStack align="start" spacing={1} maxW="1200px" mx="auto">
        <Text
          fontFamily={WD_FONTS.typewriter}
          fontSize="10px"
          letterSpacing="0.4em"
          textTransform="uppercase"
          color={WD_COLORS.brassLight}
        >
          Case File — A Gielinor Whodunnit
        </Text>
        <Text
          as="h1"
          fontFamily={WD_FONTS.heading}
          fontSize={{ base: '2xl', md: '3xl' }}
          color={WD_COLORS.paper}
          fontStyle="italic"
          lineHeight="1"
        >
          {campaign?.agencyName || 'Untitled agency'}
        </Text>

        <Wrap spacing={2} pt={2}>
          <WrapItem>
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="xs"
              color={WD_COLORS.brass}
            >
              Detectives:
            </Text>
          </WrapItem>
          {rsns.length === 0 ? (
            <WrapItem>
              <Text fontFamily={WD_FONTS.typewriter} fontSize="xs" color={WD_COLORS.paperShadow} fontStyle="italic">
                Solo case
              </Text>
            </WrapItem>
          ) : (
            rsns.map((rsn, i) => (
              <WrapItem key={rsn + i}>
                <HStack spacing={1}>
                  <Text
                    fontFamily={WD_FONTS.hand}
                    fontSize="lg"
                    color={WD_COLORS.paper}
                    lineHeight="1"
                  >
                    {rsn}
                  </Text>
                  {i < rsns.length - 1 && (
                    <Text fontFamily={WD_FONTS.typewriter} fontSize="xs" color={WD_COLORS.brass}>
                      ,
                    </Text>
                  )}
                </HStack>
              </WrapItem>
            ))
          )}
        </Wrap>

        {subtitle && (
          <Text
            fontFamily={WD_FONTS.typewriter}
            fontSize="xs"
            color={WD_COLORS.brass}
            mt={2}
          >
            {subtitle}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default CampaignHeader;
