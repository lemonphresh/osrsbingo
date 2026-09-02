import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Center,
  Wrap,
  WrapItem,
  SimpleGrid,
} from '@chakra-ui/react';
import { GET_MY_WHODUNNIT_CAMPAIGNS } from '../../graphql/whodunnitOperations';
import { useAuth } from '../../providers/AuthProvider';
import { isWhodunnitEnabled } from '../../config/featureFlags';
import usePageTitle from '../../hooks/usePageTitle';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import {
  WD_COLORS,
  WD_FONTS,
  PAPER_CARD_SX,
  paperRotation,
} from '../../organisms/whodunnit/whodunnitTheme';

function CampaignCard({ campaign }) {
  const rsns = (campaign.members || [])
    .map((m) => m.user?.rsn || m.user?.username || null)
    .filter(Boolean);
  const isComplete = campaign.status === 'COMPLETE';
  const to = isComplete
    ? `/whodunnit/campaign/${campaign.campaignId}/complete`
    : `/whodunnit/campaign/${campaign.campaignId}`;
  const rot = paperRotation(campaign.campaignId, 1.5);

  return (
    <RouterLink to={to}>
      <Box
        sx={PAPER_CARD_SX}
        p={5}
        transform={`rotate(${rot}deg)`}
        transition="transform 0.15s, box-shadow 0.15s"
        _hover={{
          transform: `rotate(0deg) translateY(-2px)`,
          boxShadow:
            '0 4px 0 rgba(0,0,0,0.18), 0 14px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      >
        <HStack justify="space-between" mb={2}>
          <Text
            fontFamily={WD_FONTS.heading}
            fontSize="lg"
            fontStyle="italic"
            color={WD_COLORS.ink}
            lineHeight="1.2"
          >
            {campaign.agencyName}
          </Text>
          <Box
            sx={{
              bg: isComplete ? WD_COLORS.fountain : WD_COLORS.wax,
              color: WD_COLORS.paper,
              px: 2,
              py: 0.5,
              fontFamily: WD_FONTS.typewriter,
              fontSize: '2xs',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              borderRadius: '2px',
            }}
          >
            {isComplete ? 'Solved' : 'Active'}
          </Box>
        </HStack>
        <Wrap spacing={1} mt={2}>
          <WrapItem>
            <Text fontFamily={WD_FONTS.typewriter} fontSize="xs" color={WD_COLORS.inkFaded}>
              Team:
            </Text>
          </WrapItem>
          {rsns.length === 0 ? (
            <WrapItem>
              <Text
                fontFamily={WD_FONTS.hand}
                fontSize="lg"
                color={WD_COLORS.inkPencil}
                lineHeight="1"
              >
                solo
              </Text>
            </WrapItem>
          ) : (
            rsns.map((rsn) => (
              <WrapItem key={rsn}>
                <Text fontFamily={WD_FONTS.hand} fontSize="lg" color={WD_COLORS.ink} lineHeight="1">
                  {rsn}
                </Text>
              </WrapItem>
            ))
          )}
        </Wrap>
      </Box>
    </RouterLink>
  );
}

const WhodunnitLanding = () => {
  usePageTitle('A Gielinor Whodunnit');
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_MY_WHODUNNIT_CAMPAIGNS, { skip: !user });

  if (!user) return <Navigate to="/login" />;
  if (!isWhodunnitEnabled(user)) return <Navigate to="/" />;

  const campaigns = data?.myWhodunnitCampaigns || [];
  const active = campaigns.filter((c) => c.status === 'ACTIVE');
  const complete = campaigns.filter((c) => c.status === 'COMPLETE');

  return (
    <WhodunnitDesk>
      <Box maxW="1000px" mx="auto" px={5} py={10}>
        <VStack spacing={7} align="stretch">
          <Box>
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="10px"
              letterSpacing="0.4em"
              color={WD_COLORS.brassLight}
              textTransform="uppercase"
              mb={1}
            >
              From the Casebook of Watson
            </Text>
            <Text
              as="h1"
              fontFamily={WD_FONTS.heading}
              fontSize={{ base: '3xl', md: '4xl' }}
              fontStyle="italic"
              color={WD_COLORS.paper}
              lineHeight="1"
            >
              A Gielinor Whodunnit
            </Text>
            <Text
              fontFamily={WD_FONTS.typewriter}
              color={WD_COLORS.brass}
              mt={4}
              maxW="640px"
              lineHeight="1.7"
            >
              Watson, master investigator, has a case. Snowflake the troll's holiday gift to My Arm
              has gone missing. He needs a team of detectives (up to four) to investigate. It will
              not go well. That's the joke.
            </Text>
          </Box>

          <HStack>
            <RouterLink to="/whodunnit/new">
              <Button
                size="lg"
                bg={WD_COLORS.wax}
                color={WD_COLORS.paper}
                _hover={{ bg: WD_COLORS.waxHighlight }}
                fontFamily={WD_FONTS.typewriter}
                letterSpacing="0.05em"
              >
                Open a new case
              </Button>
            </RouterLink>
          </HStack>

          {loading ? (
            <Center py={10}>
              <Spinner color={WD_COLORS.brassLight} />
            </Center>
          ) : (
            <>
              {active.length > 0 && (
                <Box>
                  <Text
                    fontFamily={WD_FONTS.typewriter}
                    fontSize="xs"
                    letterSpacing="0.3em"
                    color={WD_COLORS.brassLight}
                    textTransform="uppercase"
                    mb={4}
                  >
                    Active investigations
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    {active.map((c) => (
                      <CampaignCard key={c.id} campaign={c} />
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {complete.length > 0 && (
                <Box>
                  <Text
                    fontFamily={WD_FONTS.typewriter}
                    fontSize="xs"
                    letterSpacing="0.3em"
                    color={WD_COLORS.brassLight}
                    textTransform="uppercase"
                    mb={4}
                  >
                    Solved cases
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    {complete.map((c) => (
                      <CampaignCard key={c.id} campaign={c} />
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {campaigns.length === 0 && (
                <Text
                  fontFamily={WD_FONTS.hand}
                  fontSize="xl"
                  color={WD_COLORS.brass}
                  textAlign="center"
                  py={10}
                >
                  No cases yet. Watson is disappointed but not surprised.
                </Text>
              )}
            </>
          )}
        </VStack>
      </Box>
    </WhodunnitDesk>
  );
};

export default WhodunnitLanding;
