import React, { useState } from 'react';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  Icon,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import { CREATE_WHODUNNIT_CAMPAIGN } from '../../graphql/whodunnitOperations';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import { useAuth } from '../../providers/AuthProvider';
import { isWhodunnitEnabled } from '../../config/featureFlags';
import usePageTitle from '../../hooks/usePageTitle';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import { WD_COLORS, WD_FONTS, PAPER_CARD_SX } from '../../organisms/whodunnit/whodunnitTheme';

const MAX_TEAMMATES = 3;

// Renders when the current user has no Discord linked. Watson expects you
// to be reachable via Discord (matches battleship / champion forge policy).
function DiscordLinkGate({ user }) {
  return (
    <Box maxW="620px" mx="auto" px={5} py={12}>
      <Box sx={PAPER_CARD_SX} p={8}>
        <VStack align="stretch" spacing={5}>
          <HStack spacing={3}>
            <Icon as={FaDiscord} boxSize={7} color="#5865F2" />
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="lg"
              color={WD_COLORS.ink}
              fontWeight="bold"
            >
              LINK DISCORD FIRST
            </Text>
          </HStack>
          <Text fontFamily={WD_FONTS.typewriter} color={WD_COLORS.inkFaded} fontSize="sm" lineHeight="1.7">
            Watson requires all investigators to be reachable via Discord. It is not, strictly
            speaking, negotiable. Head to your profile, link your Discord account, then come back
            and open the case file.
          </Text>
          <HStack justify="flex-end" pt={2}>
            <RouterLink to="/whodunnit">
              <Button variant="ghost" color={WD_COLORS.inkFaded} fontFamily={WD_FONTS.typewriter}>
                Back
              </Button>
            </RouterLink>
            <RouterLink to={`/user/${user.id}`}>
              <Button
                bg="#5865F2"
                color="white"
                _hover={{ bg: '#4752c4' }}
                fontFamily={WD_FONTS.typewriter}
                leftIcon={<Icon as={FaDiscord} />}
              >
                Link Discord in profile
              </Button>
            </RouterLink>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

const WhodunnitCreatePage = () => {
  usePageTitle('New case • A Gielinor Whodunnit');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teammateSlots, setTeammateSlots] = useState(['']);
  const [error, setError] = useState('');

  const [createCampaign, { loading: creating }] = useMutation(CREATE_WHODUNNIT_CAMPAIGN, {
    onCompleted: (data) => {
      const id = data.createWhodunnitCampaign.campaignId;
      navigate(`/whodunnit/campaign/${id}`);
    },
    onError: (err) => setError(err.message),
    refetchQueries: ['MyWhodunnitCampaigns'],
  });

  if (!user) return <Navigate to="/login" />;
  if (!isWhodunnitEnabled(user)) return <Navigate to="/" />;

  const hasDiscordLinked = Boolean(user.discordUserId);

  const addSlot = () => {
    if (teammateSlots.length >= MAX_TEAMMATES) return;
    setTeammateSlots([...teammateSlots, '']);
  };

  const setSlot = (idx, discordId) => {
    setTeammateSlots(teammateSlots.map((v, i) => (i === idx ? discordId : v)));
  };

  const clearSlot = (idx) => {
    if (teammateSlots.length === 1) {
      setTeammateSlots(['']);
    } else {
      setTeammateSlots(teammateSlots.filter((_, i) => i !== idx));
    }
  };

  const teammateDiscordIds = teammateSlots.map((v) => v.trim()).filter(Boolean);
  const hasDuplicates = new Set(teammateDiscordIds).size !== teammateDiscordIds.length;
  const includesSelf = user.discordUserId
    ? teammateDiscordIds.includes(String(user.discordUserId))
    : false;

  const onSubmit = () => {
    setError('');
    if (hasDuplicates) {
      setError('Duplicate teammate.');
      return;
    }
    if (includesSelf) {
      setError("You're already on the team — no need to add yourself.");
      return;
    }
    // Agency name is collected inside the story at Node 1 — server defaults
    // to "Untitled Case" until then.
    createCampaign({ variables: { teammateDiscordIds } });
  };

  return (
    <WhodunnitDesk>
      {!hasDiscordLinked ? (
        <DiscordLinkGate user={user} />
      ) : (
        <Box maxW="720px" mx="auto" px={5} py={10}>
          <VStack spacing={5} align="stretch">
            <Box>
              <Text
                fontFamily={WD_FONTS.typewriter}
                fontSize="10px"
                letterSpacing="0.4em"
                color={WD_COLORS.brassLight}
                textTransform="uppercase"
                mb={1}
              >
                New Case File
              </Text>
              <Text
                as="h1"
                fontFamily={WD_FONTS.heading}
                fontSize="3xl"
                fontStyle="italic"
                color={WD_COLORS.paper}
              >
                Open a new investigation
              </Text>
              <Text fontFamily={WD_FONTS.typewriter} color={WD_COLORS.brass} mt={2} fontSize="sm">
                Invite up to 3 clanmates. Watson will ask you to name your agency once the case
                file is open. Everyone advances the story and updates the notebook.
              </Text>
            </Box>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <Box sx={PAPER_CARD_SX} p={6}>
              <VStack align="stretch" spacing={5}>
                <FormControl>
                  <FormLabel
                    fontFamily={WD_FONTS.typewriter}
                    fontSize="xs"
                    letterSpacing="0.15em"
                    textTransform="uppercase"
                    color={WD_COLORS.inkFaded}
                  >
                    Teammates (optional, up to {MAX_TEAMMATES})
                  </FormLabel>
                  <VStack spacing={3} align="stretch">
                    {teammateSlots.map((discordId, idx) => (
                      <DiscordMemberInput
                        key={idx}
                        value={discordId}
                        onChange={(id) => setSlot(idx, id || '')}
                        onRemove={() => clearSlot(idx)}
                        showRemove={Boolean(discordId) || teammateSlots.length > 1}
                        colorMode="wd"
                        isDuplicateInForm={
                          discordId
                            ? teammateDiscordIds.filter((d) => d === discordId).length > 1
                            : false
                        }
                      />
                    ))}
                    {teammateSlots.length < MAX_TEAMMATES && (
                      <Button
                        leftIcon={<AddIcon />}
                        size="sm"
                        variant="outline"
                        onClick={addSlot}
                        alignSelf="flex-start"
                        borderColor={WD_COLORS.paperShadow}
                        color={WD_COLORS.inkFaded}
                        bg="transparent"
                        _hover={{ bg: 'rgba(0,0,0,0.06)', borderColor: WD_COLORS.inkFaded }}
                        fontFamily={WD_FONTS.typewriter}
                      >
                        Add teammate
                      </Button>
                    )}
                  </VStack>
                  <FormHelperText
                    color={WD_COLORS.inkPencil}
                    fontFamily={WD_FONTS.typewriter}
                    fontSize="xs"
                    fontStyle="italic"
                    mt={2}
                  >
                    Search by RSN, Discord username, or Discord ID.
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>

            <HStack justify="flex-end">
              <Button
                variant="ghost"
                onClick={() => navigate('/whodunnit')}
                color={WD_COLORS.paperShadow}
                fontFamily={WD_FONTS.typewriter}
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                isLoading={creating}
                bg={WD_COLORS.wax}
                color={WD_COLORS.paper}
                _hover={{ bg: WD_COLORS.waxHighlight }}
                fontFamily={WD_FONTS.typewriter}
                letterSpacing="0.05em"
              >
                Begin the investigation
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </WhodunnitDesk>
  );
};

export default WhodunnitCreatePage;
