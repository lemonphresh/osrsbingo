import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Text,
  VStack,
  HStack,
  Heading,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import SpoopyUiIcon from './SpoopyUiIcon';
import { formatCandy, formatGp } from './spoopyCurrency';
import candyIconAsset from '../../assets/spoopy/candy_individual.webp';

// Overlay that pops the moment a team cashes out at the spooky house. The
// goal is twofold: (1) celebrate the haul, and (2) hard-lock the board so a
// cashed-out team can't keep opening tiles / submitting after the fact —
// their night is done, they're just waiting for the rest of the crews. The
// modal is non-dismissable (no close button, closeOnOverlayClick=false,
// closeOnEsc=false) and stays mounted until the event flips to COMPLETE,
// at which point the parent page swaps to the recap.
//
// Forfeited teams get their own treatment elsewhere; this one is strictly
// for the happy "we made it" path.
export default function SpoopyCashedOutModal({ isOpen, gpEarned, teamName }) {
  const total = gpEarned ?? 0;
  return (
    <Modal
      isOpen={Boolean(isOpen)}
      onClose={() => {}}
      size={{ base: 'full', md: 'xl' }}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay bg="rgba(20, 12, 26, 0.92)" backdropFilter="blur(6px)" />
      <ModalContent
        bg={SPOOPY_COLORS.night}
        color={SPOOPY_COLORS.paper}
        border="4px solid"
        borderColor={SPOOPY_COLORS.pumpkin}
        boxShadow={`0 0 60px rgba(238, 118, 35, 0.45), 0 24px 48px rgba(0,0,0,0.5)`}
        transform="rotate(-0.3deg)"
      >
        <ModalBody py={{ base: 8, md: 10 }} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            {/* Scattered celebration icons across the top */}
            <HStack
              fontSize={{ base: '2xl', md: '4xl' }}
              lineHeight={1}
              justify="center"
              spacing={{ base: 3, md: 5 }}
              opacity={0.95}
            >
              <Box transform="rotate(-10deg)" color={SPOOPY_COLORS.pumpkin}>
                <SpoopyUiIcon name="party" />
              </Box>
              <Box transform="rotate(5deg)" color={SPOOPY_COLORS.pumpkinLight}>
                <SpoopyUiIcon name="candy" />
              </Box>
              <Box transform="rotate(-6deg)" color={SPOOPY_COLORS.pumpkin}>
                <SpoopyUiIcon name="trophy" />
              </Box>
              <Box transform="rotate(8deg)" color={SPOOPY_COLORS.pumpkinLight}>
                <SpoopyUiIcon name="candy" />
              </Box>
              <Box transform="rotate(-4deg)" color={SPOOPY_COLORS.pumpkin}>
                <SpoopyUiIcon name="party" />
              </Box>
            </HStack>

            <Heading
              size={{ base: 'lg', md: 'xl' }}
              fontFamily={SPOOPY_FONTS.heading}
              color={SPOOPY_COLORS.pumpkinLight}
              textAlign="center"
              letterSpacing="wider"
            >
              your team cashed out!
            </Heading>

            {teamName && (
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize={{ base: 'md', md: 'lg' }}
                textAlign="center"
                opacity={0.85}
              >
                nice work, {teamName}.
              </Text>
            )}

            {/* The haul — big candy count front and center. */}
            <Box
              bg="rgba(238, 118, 35, 0.12)"
              border="2px dashed"
              borderColor={SPOOPY_COLORS.pumpkin}
              borderRadius="lg"
              py={{ base: 5, md: 6 }}
              px={{ base: 4, md: 6 }}
              textAlign="center"
            >
              <Text
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
                opacity={0.7}
                mb={2}
              >
                final haul
              </Text>
              <HStack spacing={3} justify="center" align="center">
                <Box as="img" src={candyIconAsset} alt="candy" w={{ base: '32px', md: '40px' }} h="auto" />
                <Text
                  fontFamily={SPOOPY_FONTS.hand}
                  fontSize={{ base: '4xl', md: '5xl' }}
                  color={SPOOPY_COLORS.paper}
                  lineHeight={1}
                >
                  {formatCandy(total)}
                </Text>
              </HStack>
              <Text fontSize="xs" opacity={0.6} mt={2}>
                ({formatGp(total)})
              </Text>
            </Box>

            {/* Flavor + "wait at the end of the block" copy */}
            <VStack spacing={2} textAlign="center" pt={1}>
              <Text fontFamily={SPOOPY_FONTS.hand} fontSize={{ base: 'md', md: 'lg' }} lineHeight={1.5}>
                let's wait at the end of the block to see if the rest of the crews show up and
                compare our loot!
              </Text>
              <Text fontSize="sm" opacity={0.7}>
                your night of trick-or-treating is done. the board is locked in. hang tight for the
                recap when the event wraps.
              </Text>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
