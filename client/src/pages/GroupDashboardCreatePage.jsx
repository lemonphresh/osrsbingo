import {
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Badge,
  Link,
  Stack,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CheckIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAuth } from '../providers/AuthProvider';
import { CREATE_GROUP_DASHBOARD } from '../graphql/groupDashboardOperations';
import usePageTitle from '../hooks/usePageTitle';

// ── Local guide sub-components ──────────────────────────────────────────────

function Strong({ children }) {
  return (
    <Text as="span" fontWeight="semibold" color="gray.200">
      {children}
    </Text>
  );
}

function GuidePoint({ children }) {
  return (
    <HStack align="flex-start" spacing={2}>
      <Text color="gray.600" fontSize="sm" flexShrink={0} mt="1px">
        ›
      </Text>
      <Text fontSize="sm" color="gray.400" lineHeight="1.5">
        {children}
      </Text>
    </HStack>
  );
}

function GuideStep({ n, title, color, last, children }) {
  return (
    <HStack align="flex-start" spacing={4}>
      {/* Timeline column */}
      <VStack spacing={0} flexShrink={0} align="center">
        <Flex
          w="28px"
          h="28px"
          borderRadius="full"
          bg={color}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.900" lineHeight="1">
            {n}
          </Text>
        </Flex>
        {!last && <Box w="2px" flex="1" minH="16px" bg="gray.700" mt={1} />}
      </VStack>
      {/* Content */}
      <VStack align="stretch" spacing={2} pb={last ? 0 : 6} flex={1} minW={0}>
        <Text fontWeight="semibold" color="gray.200" fontSize="sm" pt="4px">
          {title}
        </Text>
        {children}
      </VStack>
    </HStack>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function GroupDashboardCreatePage() {
  usePageTitle('Create Group Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState('');
  const [womGroupId, setWomGroupId] = useState('');
  const [slugOverride, setSlugOverride] = useState('');
  const [verifiedGroup, setVerifiedGroup] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [createDashboard, { loading, error }] = useMutation(CREATE_GROUP_DASHBOARD, {
    onCompleted: (data) => {
      navigate(`/group/${data.createGroupDashboard.slug}/manage`);
    },
  });

  async function handleVerifyWom() {
    setVerifyError(null);
    setVerifiedGroup(null);
    if (!womGroupId.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`https://api.wiseoldman.net/v2/groups/${womGroupId.trim()}`);
      if (!res.ok) {
        setVerifyError('WOM group not found. Check your group ID.');
        return;
      }
      const data = await res.json();
      setVerifiedGroup({ name: data.name, memberCount: data.memberships?.length ?? 0 });
    } catch {
      setVerifyError('Failed to reach WOM API. Try again.');
    } finally {
      setVerifying(false);
    }
  }

  function handleCreate() {
    if (!groupName.trim() || !womGroupId.trim()) return;
    createDashboard({
      variables: {
        input: {
          groupName: groupName.trim(),
          womGroupId: womGroupId.trim(),
          ...(slugOverride.trim() ? { slug: slugOverride.trim() } : {}),
        },
      },
    });
  }

  if (!user) {
    return (
      <Box maxW="700px" mx="auto" mt={16} textAlign="center">
        <Text color="gray.400">You need to be logged in to create a group dashboard.</Text>
      </Box>
    );
  }

  return (
    <Flex
      alignItems="flex-start"
      flex="1"
      flexDirection="column"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingBottom={['72px', '112px']}
      paddingTop={['56px', '72px']}
    >
      <Box maxW="960px" w="100%" mx="auto">
        <VStack align="flex-start" spacing={1} mb={8}>
          <Heading size="lg" color="gray.100">
            Create Group Dashboard
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Track collective goals for your WOM-registered group: clans, PVM teams, skill groups,
            anything.
          </Text>
        </VStack>

        <Stack direction={['column', 'column', 'row']} spacing={8} align="flex-start">
          {/* ── LEFT: Setup guide ── */}
          <Box flex="1" minW={0}>
            <VStack spacing={5} align="stretch">
              {/* Step 1 */}
              <GuideStep n="1" title="Create or find your WOM group" color="purple.400">
                <Text fontSize="sm" color="gray.400">
                  Wise Old Man (WOM) is a free OSRS stat tracking site. Your group needs to be
                  registered there before you can create a dashboard here.
                </Text>
                <VStack align="stretch" spacing={1} mt={2}>
                  <GuidePoint>
                    Go to{' '}
                    <Link href="https://wiseoldman.net/groups" isExternal color="purple.300">
                      wiseoldman.net/groups <ExternalLinkIcon mx="2px" boxSize={3} />
                    </Link>
                  </GuidePoint>
                  <GuidePoint>
                    Click <Strong>Create new group</Strong> (top right)
                  </GuidePoint>
                  <GuidePoint>Give your group a name and add member RSNs</GuidePoint>
                  <GuidePoint>WOM will start tracking all added members automatically</GuidePoint>
                </VStack>
                <Box
                  mt={3}
                  p={3}
                  bg="gray.800"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Text fontSize="xs" color="gray.500">
                    Already have a WOM group? Skip straight to Step 2.
                  </Text>
                </Box>
              </GuideStep>

              {/* Step 2 */}
              <GuideStep n="2" title="Find your WOM Group ID" color="blue.400">
                <Text fontSize="sm" color="gray.400">
                  Your Group ID is the number in the URL when you view your group on WOM.
                </Text>
                <Box
                  mt={2}
                  p={3}
                  bg="gray.800"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.700"
                  fontFamily="mono"
                >
                  <Text fontSize="xs" color="gray.500">
                    wiseoldman.net/groups/
                  </Text>
                  <Text fontSize="sm" color="yellow.300" display="inline">
                    9738
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    ↑ this number is your Group ID
                  </Text>
                </Box>
                <VStack align="stretch" spacing={1} mt={2}>
                  <GuidePoint>Open your group page on WOM</GuidePoint>
                  <GuidePoint>Copy the number from the URL bar</GuidePoint>
                  <GuidePoint>
                    Paste it into the <Strong>WOM Group ID</Strong> field on the right, then click{' '}
                    <Strong>Verify</Strong>
                  </GuidePoint>
                </VStack>
              </GuideStep>

              {/* Step 3 */}
              <GuideStep n="3" title="Create your dashboard" color="green.400">
                <VStack align="stretch" spacing={1}>
                  <GuidePoint>
                    Enter a <Strong>display name</Strong> for your group (shown publicly on the
                    dashboard)
                  </GuidePoint>
                  <GuidePoint>
                    Paste your WOM Group ID and hit <Strong>Verify</Strong> to confirm it exists
                  </GuidePoint>
                  <GuidePoint>
                    Optionally set a <Strong>custom URL slug</Strong> (i.e.{' '}
                    <Text as="span" fontFamily="mono" color="gray.300">
                      /group/big-iron-clan
                    </Text>
                    ), otherwise one is generated from your group name
                  </GuidePoint>
                  <GuidePoint>
                    Click <Strong>Create Dashboard</Strong>
                  </GuidePoint>
                </VStack>
              </GuideStep>

              {/* Step 4 */}
              <GuideStep n="4" title="Add events & goals" color="orange.400">
                <Text fontSize="sm" color="gray.400">
                  After creating, you'll land on the manage page where you can set up tracking.
                </Text>
                <VStack align="stretch" spacing={1} mt={2}>
                  <GuidePoint>
                    Click <Strong>Add Event</Strong> and give it a name, start date, and end date
                  </GuidePoint>
                  <GuidePoint>
                    Add <Strong>goals</Strong> to the event — choose from Boss KC, Skill XP, EHB, or
                    EHP
                  </GuidePoint>
                  <GuidePoint>
                    Set a <Strong>target</Strong> (i.e. 5,000 Vardorvis KC) and an emoji
                  </GuidePoint>
                  <GuidePoint>
                    Save! Progress updates automatically every hour from WOM data
                  </GuidePoint>
                </VStack>
              </GuideStep>

              {/* Step 5 */}
              <GuideStep n="5" title="Share the public link" color="pink.400" last>
                <Text fontSize="sm" color="gray.400">
                  Your dashboard has a public URL that anyone can view, no login required. Share it
                  with your clan Discord or post it in your group chat.
                </Text>
                <Box
                  mt={2}
                  p={3}
                  bg="gray.800"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.700"
                  fontFamily="mono"
                >
                  <Text fontSize="xs" color="gray.500">
                    osrsbingo.com/group/
                  </Text>
                  <Text fontSize="sm" color="purple.300" display="inline">
                    your-group-slug
                  </Text>
                </Box>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Optionally connect a Discord channel for automatic milestone notifications (25%,
                  50%, 75%, 100%).
                </Text>
              </GuideStep>
            </VStack>
          </Box>

          {/* ── RIGHT: Form ── */}
          <Box w={['100%', '100%', '380px']} flexShrink={0}>
            <VStack
              spacing={5}
              align="stretch"
              bg="gray.800"
              borderRadius="xl"
              p={6}
              position={['static', 'static', 'sticky']}
              top="24px"
            >
              <Text fontWeight="bold" color="gray.200" fontSize="md">
                Dashboard Details
              </Text>

              <FormControl isRequired>
                <FormLabel color="gray.300" fontSize="sm">
                  Group Name
                </FormLabel>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="i.e. Iron Wolves"
                  bg="gray.700"
                  borderColor="gray.600"
                  size="sm"
                />
              </FormControl>

              <FormControl isRequired isInvalid={!!verifyError}>
                <FormLabel color="gray.300" fontSize="sm">
                  WOM Group ID
                </FormLabel>
                <HStack>
                  <Input
                    value={womGroupId}
                    onChange={(e) => {
                      setWomGroupId(e.target.value);
                      setVerifiedGroup(null);
                    }}
                    placeholder="i.e. 9738"
                    bg="gray.700"
                    borderColor="gray.600"
                    fontFamily="mono"
                    size="sm"
                  />
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant="outline"
                    onClick={handleVerifyWom}
                    isLoading={verifying}
                    isDisabled={!womGroupId.trim()}
                    flexShrink={0}
                  >
                    Verify
                  </Button>
                </HStack>
                {verifyError && <FormErrorMessage>{verifyError}</FormErrorMessage>}
                {verifiedGroup && (
                  <HStack mt={2} spacing={2}>
                    <CheckIcon color="green.400" boxSize={3} />
                    <Text fontSize="sm" color="green.400">
                      {verifiedGroup.name}
                    </Text>
                    <Badge colorScheme="gray" fontSize="xs">
                      {verifiedGroup.memberCount} members
                    </Badge>
                  </HStack>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300" fontSize="sm">
                  Custom Slug{' '}
                  <Text as="span" color="gray.500" fontWeight="normal">
                    (optional)
                  </Text>
                </FormLabel>
                <HStack>
                  <Text fontSize="sm" color="gray.500" flexShrink={0}>
                    /group/
                  </Text>
                  <Input
                    value={slugOverride}
                    onChange={(e) =>
                      setSlugOverride(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="iron-wolves"
                    bg="gray.700"
                    borderColor="gray.600"
                    fontFamily="mono"
                    size="sm"
                  />
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Leave blank to auto-generate from your group name
                </Text>
              </FormControl>

              {error && (
                <Text fontSize="sm" color="red.400">
                  {error.message}
                </Text>
              )}

              <Button
                colorScheme="purple"
                onClick={handleCreate}
                isLoading={loading}
                isDisabled={!groupName.trim() || !womGroupId.trim()}
                size="md"
                w="100%"
              >
                Create Dashboard
              </Button>
            </VStack>
          </Box>
        </Stack>
      </Box>
    </Flex>
  );
}
