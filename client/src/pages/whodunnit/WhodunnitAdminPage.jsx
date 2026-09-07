import React from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  Heading,
  Link,
} from '@chakra-ui/react';
import {
  GET_ALL_WHODUNNIT_CAMPAIGNS,
  GET_WHODUNNIT_STORY,
} from '../../graphql/whodunnitOperations';
import { getNode } from '../../utils/whodunnit/storyEngine';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import { WD_COLORS, WD_FONTS } from '../../organisms/whodunnit/whodunnitTheme';
import { useAuth } from '../../providers/AuthProvider';
import usePageTitle from '../../hooks/usePageTitle';

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const WhodunnitAdminPage = () => {
  const { user } = useAuth();
  usePageTitle('Whodunnit Admin');
  const { data, loading } = useQuery(GET_ALL_WHODUNNIT_CAMPAIGNS, { skip: !user?.admin });
  const { data: storyData } = useQuery(GET_WHODUNNIT_STORY, { skip: !user?.admin });

  if (!user) return <Navigate to="/login" />;
  if (!user.admin) return <Navigate to="/" />;

  const campaigns = data?.allWhodunnitCampaigns || [];
  const story = storyData?.whodunnitStory;

  return (
    <WhodunnitDesk>
      <Box maxW="1400px" mx="auto" px={5} py={8}>
        <VStack align="stretch" spacing={5}>
          <Box>
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="10px"
              letterSpacing="0.4em"
              color={WD_COLORS.brassLight}
              textTransform="uppercase"
              mb={1}
            >
              Administrator's Ledger
            </Text>
            <Heading
              fontFamily={WD_FONTS.heading}
              fontStyle="italic"
              size="lg"
              color={WD_COLORS.paper}
            >
              All Campaigns ({campaigns.length})
            </Heading>
          </Box>

        {loading ? (
          <Center py={10}>
            <Spinner color="purple.300" />
          </Center>
        ) : (
          <Box bg="#0d2137" border="1px solid #1e4976" borderRadius="md" overflowX="auto">
            <Table variant="simple" size="sm" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th color="gray.300">Agency</Th>
                  <Th color="gray.300">Team</Th>
                  <Th color="gray.300">Status</Th>
                  <Th color="gray.300">Current node</Th>
                  <Th color="gray.300">Choices</Th>
                  <Th color="gray.300">Duration</Th>
                  <Th color="gray.300">Hints</Th>
                  <Th color="gray.300">Prime suspect</Th>
                </Tr>
              </Thead>
              <Tbody>
                {campaigns.map((c) => {
                  const node = getNode(story, c.currentNodeId);
                  const rsns = (c.members || [])
                    .map((m) => m.user?.rsn || m.user?.username || '?')
                    .join(', ');
                  const totalHints = (c.nodeProgress || []).reduce(
                    (sum, p) => sum + (p.hintUsedClueIds?.length || 0),
                    0,
                  );
                  const duration = c.completedAt
                    ? c.totalDurationSeconds
                    : Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 1000);
                  return (
                    <Tr key={c.id}>
                      <Td>
                        <Link
                          as={RouterLink}
                          to={
                            c.status === 'COMPLETE'
                              ? `/whodunnit/campaign/${c.campaignId}/complete`
                              : `/whodunnit/campaign/${c.campaignId}`
                          }
                          color="purple.300"
                        >
                          {c.agencyName}
                        </Link>
                      </Td>
                      <Td color="gray.200" fontSize="xs">{rsns}</Td>
                      <Td>
                        <Badge colorScheme={c.status === 'COMPLETE' ? 'green' : 'yellow'}>
                          {c.status}
                        </Badge>
                      </Td>
                      <Td color="gray.200">
                        {node?.index ? `#${node.index}` : ''} {node?.title || c.currentNodeId}
                      </Td>
                      <Td color="gray.300" fontSize="xs">
                        A: {c.choiceAPath || '—'} · B: {c.choiceBPath || '—'}
                      </Td>
                      <Td color="gray.200">{formatDuration(duration)}</Td>
                      <Td color="gray.200">{totalHints}</Td>
                      <Td color="gray.400" fontSize="xs" fontStyle="italic">
                        {c.primeSuspect || '—'}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
        </VStack>
      </Box>
    </WhodunnitDesk>
  );
};

export default WhodunnitAdminPage;
