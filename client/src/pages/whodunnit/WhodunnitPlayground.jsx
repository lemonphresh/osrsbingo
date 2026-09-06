import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Divider,
  Wrap,
  WrapItem,
  Button,
  Select,
} from '@chakra-ui/react';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import CampaignHeader from '../../organisms/whodunnit/CampaignHeader';
import WaxSeal from '../../organisms/whodunnit/WaxSeal';
import EnvelopeReveal from '../../organisms/whodunnit/EnvelopeReveal';
import {
  WD_COLORS,
  WD_FONTS,
  PAPER_CARD_SX,
  MANILA_FOLDER_SX,
  paperRotation,
} from '../../organisms/whodunnit/whodunnitTheme';
import {
  FaTree,
  FaSnowflake,
  FaGift,
  FaBell,
  FaStar,
  FaHeart,
} from 'react-icons/fa';
import { useAuth } from '../../providers/AuthProvider';
import usePageTitle from '../../hooks/usePageTitle';

// Admin-only styleguide for the whodunnit event type. Swatches, typography
// samples, card treatments, wax seals, side-by-side. Purpose: iterate on the
// desk visual without disturbing the live campaign flow.

function Swatch({ name, hex }) {
  const isDark = /^#[0-4]/.test(hex);
  return (
    <VStack spacing={1} align="stretch">
      <Box
        bg={hex}
        h="60px"
        borderRadius="2px"
        border="1px solid rgba(0,0,0,0.3)"
        boxShadow="inset 0 1px 0 rgba(255,255,255,0.1)"
      />
      <Text
        fontFamily={WD_FONTS.typewriter}
        fontSize="xs"
        color={WD_COLORS.paper}
      >
        {name}
      </Text>
      <Text
        fontFamily={WD_FONTS.typewriter}
        fontSize="10px"
        color={WD_COLORS.brass}
      >
        {hex}
      </Text>
    </VStack>
  );
}

function Section({ title, children }) {
  return (
    <Box>
      <Text
        fontFamily={WD_FONTS.typewriter}
        fontSize="10px"
        letterSpacing="0.4em"
        color={WD_COLORS.brassLight}
        textTransform="uppercase"
        mb={3}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

const DUMMY_CAMPAIGN = {
  agencyName: 'The Cold Case Squad',
  members: [
    { user: { rsn: 'Lemon' } },
    { user: { rsn: 'Healsha' } },
    { user: { rsn: 'Lexi' } },
    { user: { rsn: 'Kiuyu' } },
  ],
};

const ENVELOPE_ICONS = {
  Tree: FaTree,
  Snowflake: FaSnowflake,
  Gift: FaGift,
  Bell: FaBell,
  Star: FaStar,
  Heart: FaHeart,
};

const WhodunnitPlayground = () => {
  const { user } = useAuth();
  usePageTitle('Whodunnit Playground');

  // Bumping this key remounts EnvelopeReveal to replay the animation.
  const [envelopeKey, setEnvelopeKey] = useState(0);
  const [envelopeIcon, setEnvelopeIcon] = useState('Tree');

  if (!user) return <Navigate to="/login" />;
  if (!user.admin) return <Navigate to="/" />;

  return (
    <WhodunnitDesk>
      {envelopeKey > 0 && (
        <EnvelopeReveal
          key={envelopeKey}
          icon={ENVELOPE_ICONS[envelopeIcon]}
          sealLabel="DEMO"
        />
      )}
      <CampaignHeader campaign={DUMMY_CAMPAIGN} subtitle="Style playground — admin only" />
      <Box maxW="1200px" mx="auto" px={5} py={8}>
        <VStack align="stretch" spacing={10}>

          <Section title="Envelope reveal">
            <HStack spacing={3}>
              <Button
                onClick={() => setEnvelopeKey((k) => k + 1)}
                bg={WD_COLORS.wax}
                color={WD_COLORS.paper}
                _hover={{ bg: WD_COLORS.waxHighlight }}
                fontFamily={WD_FONTS.typewriter}
              >
                ▶ Play envelope reveal
              </Button>
              <Select
                value={envelopeIcon}
                onChange={(e) => setEnvelopeIcon(e.target.value)}
                width="auto"
                bg={WD_COLORS.paper}
                color={WD_COLORS.ink}
                borderColor={WD_COLORS.paperShadow}
                fontFamily={WD_FONTS.typewriter}
              >
                {Object.keys(ENVELOPE_ICONS).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
              <Text
                fontFamily={WD_FONTS.hand}
                fontSize="lg"
                color={WD_COLORS.brass}
                fontStyle="italic"
              >
                ← plays without setting a sessionStorage key so it always fires
              </Text>
            </HStack>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />


          <Section title="Palette">
            <SimpleGrid columns={{ base: 3, md: 6 }} spacing={4}>
              <Swatch name="deskDeep" hex={WD_COLORS.deskDeep} />
              <Swatch name="desk" hex={WD_COLORS.desk} />
              <Swatch name="deskWorn" hex={WD_COLORS.deskWorn} />
              <Swatch name="deskEdge" hex={WD_COLORS.deskEdge} />
              <Swatch name="paper" hex={WD_COLORS.paper} />
              <Swatch name="paperEdge" hex={WD_COLORS.paperEdge} />
              <Swatch name="paperShadow" hex={WD_COLORS.paperShadow} />
              <Swatch name="paperFold" hex={WD_COLORS.paperFold} />
              <Swatch name="ink" hex={WD_COLORS.ink} />
              <Swatch name="inkFaded" hex={WD_COLORS.inkFaded} />
              <Swatch name="inkPencil" hex={WD_COLORS.inkPencil} />
              <Swatch name="manila" hex={WD_COLORS.manila} />
              <Swatch name="manilaShadow" hex={WD_COLORS.manilaShadow} />
              <Swatch name="manilaEdge" hex={WD_COLORS.manilaEdge} />
              <Swatch name="wax" hex={WD_COLORS.wax} />
              <Swatch name="waxDeep" hex={WD_COLORS.waxDeep} />
              <Swatch name="waxHighlight" hex={WD_COLORS.waxHighlight} />
              <Swatch name="brass" hex={WD_COLORS.brass} />
              <Swatch name="brassLight" hex={WD_COLORS.brassLight} />
              <Swatch name="brassDeep" hex={WD_COLORS.brassDeep} />
              <Swatch name="fountain" hex={WD_COLORS.fountain} />
              <Swatch name="fountainDeep" hex={WD_COLORS.fountainDeep} />
            </SimpleGrid>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />

          <Section title="Typography">
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text
                  fontFamily={WD_FONTS.heading}
                  fontStyle="italic"
                  fontSize="4xl"
                  color={WD_COLORS.paper}
                  lineHeight="1"
                >
                  A Gielinor Whodunnit
                </Text>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="10px" color={WD_COLORS.brass}>
                  heading — Georgia italic
                </Text>
              </Box>
              <Box>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="lg" color={WD_COLORS.paper}>
                  The typewriter font handles interface copy, buttons, and case notes.
                </Text>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="10px" color={WD_COLORS.brass}>
                  typewriter — Special Elite
                </Text>
              </Box>
              <Box>
                <Text fontFamily={WD_FONTS.hand} fontSize="2xl" color={WD_COLORS.paper} lineHeight="1">
                  scribbled in the margin — Lemon has a hunch about the monkey
                </Text>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="10px" color={WD_COLORS.brass}>
                  hand — Caveat
                </Text>
              </Box>
            </VStack>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />

          <Section title="Paper card — with deterministic tilt">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              {['case-a', 'case-b', 'case-c'].map((key) => (
                <Box
                  key={key}
                  sx={PAPER_CARD_SX}
                  p={4}
                  transform={`rotate(${paperRotation(key, 2)}deg)`}
                >
                  <Text fontFamily={WD_FONTS.heading} fontStyle="italic" fontSize="lg" color={WD_COLORS.ink}>
                    {key}
                  </Text>
                  <Text fontFamily={WD_FONTS.typewriter} fontSize="sm" color={WD_COLORS.inkFaded} mt={2}>
                    Aged paper. Slight torn edge. Sits on the desk at a deliberate angle.
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />

          <Section title="Manila folder & wax seal">
            <HStack spacing={5} align="flex-start" flexWrap="wrap">
              <Box sx={MANILA_FOLDER_SX} p={6} maxW="360px" flex="1">
                <Text
                  fontFamily={WD_FONTS.typewriter}
                  fontSize="xs"
                  letterSpacing="0.15em"
                  color={WD_COLORS.manilaEdge}
                  textTransform="uppercase"
                  mb={2}
                >
                  Case No. 042
                </Text>
                <Text fontFamily={WD_FONTS.heading} fontStyle="italic" fontSize="lg" color={WD_COLORS.ink}>
                  The Missing Snowglobe
                </Text>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="sm" color={WD_COLORS.ink} mt={2}>
                  Contents: interview transcripts, anagrams, one increasingly deranged notebook.
                </Text>
              </Box>
              <VStack spacing={4} align="flex-start">
                <HStack spacing={10} pt={2} pb={8}>
                  <WaxSeal label="CONF" icon={FaTree} rotate={-8} />
                  <WaxSeal label="W" icon={FaSnowflake} rotate={6} />
                  <WaxSeal label="042" icon={FaGift} rotate={-3} />
                </HStack>
                <Text fontFamily={WD_FONTS.typewriter} fontSize="xs" color={WD_COLORS.brass}>
                  wax seals with holiday ribbons peeking out from underneath
                </Text>
              </VStack>
            </HStack>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />

          <Section title="More ribbon icons">
            <HStack spacing={10} pt={2} pb={8} flexWrap="wrap">
              <WaxSeal label="!" icon={FaBell} rotate={-10} />
              <WaxSeal label="?" icon={FaStar} rotate={2} />
              <WaxSeal label="✦" icon={FaHeart} rotate={-4} />
              <WaxSeal label="CONF" rotate={-6} />
              <Text
                fontFamily={WD_FONTS.hand}
                fontSize="lg"
                color={WD_COLORS.brass}
                fontStyle="italic"
                alignSelf="center"
              >
                ← the last one has no ribbon (icon prop omitted)
              </Text>
            </HStack>
          </Section>

          <Divider borderColor="rgba(0,0,0,0.3)" />

          <Section title="Team roster">
            <Box sx={PAPER_CARD_SX} p={4}>
              <Wrap spacing={2}>
                {DUMMY_CAMPAIGN.members.map((m) => (
                  <WrapItem key={m.user.rsn}>
                    <Text fontFamily={WD_FONTS.hand} fontSize="xl" color={WD_COLORS.ink} lineHeight="1">
                      {m.user.rsn}
                    </Text>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          </Section>

        </VStack>
      </Box>
    </WhodunnitDesk>
  );
};

export default WhodunnitPlayground;
