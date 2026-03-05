import React from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Link as ChakraLink,
  Divider,
  Image,
} from '@chakra-ui/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import SuccessImg from '../../assets/success.webp';
import { FaCoffee, FaHeart } from 'react-icons/fa';
import PleaseEffect from '../../atoms/PleaseEffect';

const MEDALS = ['🥇', '🥈', '🥉'];
const DIFF_LABEL = { 1: 'E', 3: 'M', 5: 'H' };
const DIFF_COLOR = { 1: 'green', 3: 'yellow', 5: 'red' };

function toNum(gpStr) {
  return Number(gpStr || 0) || 0;
}

function formatGP(gpStr) {
  return toNum(gpStr).toLocaleString();
}

function getDiffBreakdown(completedNodeIds, nodes) {
  const counts = { 1: 0, 3: 0, 5: 0 };
  completedNodeIds?.forEach((id) => {
    const node = nodes?.find((n) => n.nodeId === id);
    if (node?.difficultyTier != null)
      counts[node.difficultyTier] = (counts[node.difficultyTier] || 0) + 1;
  });
  return counts;
}

export default function EventSummaryPanel({ event, teams = [], nodes = [] }) {
  const { colors: currentColors } = useThemeColors();

  const sorted = [...teams].sort((a, b) => toNum(b.currentPot) - toNum(a.currentPot));

  const totalGP = teams.reduce((sum, t) => sum + toNum(t.currentPot), 0);

  const totalNodesCompleted = teams.reduce((sum, t) => sum + (t.completedNodes?.length || 0), 0);

  return (
    <Box bg="gray.700" borderRadius="lg" p={6}>
      <VStack align="start" spacing={6}>
        {/* Header */}
        <VStack align="start" spacing={1}>
          <HStack>
            <Text fontSize="2xl">🏁</Text>
            <Heading size="lg" color={currentColors.white}>
              {event.eventName}
            </Heading>
          </HStack>
          <Text fontSize="sm" color="gray.300">
            Ended {formatDisplayDateTime(event.endDate)}
          </Text>
        </VStack>

        {event.status !== 'ARCHIVED' && (
          <Image
            src={SuccessImg}
            maxHeight="300px"
            objectFit="contain"
            borderRadius="lg"
            alignSelf="center"
            my={3}
          />
        )}

        {/* Stats row */}
        <StatGroup w="full">
          <Stat>
            <StatLabel color="gray.300">Teams</StatLabel>
            <StatNumber color={currentColors.white}>{teams.length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel color="gray.300">Nodes Completed</StatLabel>
            <StatNumber color={currentColors.white}>{totalNodesCompleted}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel color="gray.300">Total GP Distributed</StatLabel>
            <StatNumber color="yellow.400" fontSize={['md', 'lg', 'xl']}>
              {totalGP.toLocaleString()} gp
            </StatNumber>
          </Stat>
        </StatGroup>
        <Divider borderColor="gray.200" />
        {/* Leaderboard */}
        <Box w="full" overflowX="auto">
          <Heading size="sm" color={currentColors.white} mb={3}>
            Final Standings
          </Heading>
          <Table size="sm" variant="striped" colorScheme="whiteAlpha">
            <Thead>
              <Tr>
                <Th color="gray.300" w="40px">
                  #
                </Th>
                <Th color="gray.300">Team</Th>
                <Th color="gray.300" isNumeric>
                  GP Earned
                </Th>
                <Th color="gray.300" isNumeric>
                  Nodes
                </Th>
                <Th color="gray.300">Keys</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sorted.map((team, i) => {
                const diff = getDiffBreakdown(team.completedNodes, nodes);
                return (
                  <Tr key={team.teamId}>
                    <Td color={currentColors.white} fontWeight="semibold">
                      {MEDALS[i] ?? i + 1}
                    </Td>
                    <Td color={currentColors.white} fontWeight={i === 0 ? 'bold' : 'normal'}>
                      {team.teamName}
                    </Td>
                    <Td isNumeric color="yellow.400" fontWeight="semibold">
                      {formatGP(team.currentPot)}
                    </Td>
                    <Td isNumeric color={currentColors.white}>
                      {team.completedNodes?.length || 0}
                    </Td>
                    <Td>
                      <HStack spacing={1} flexWrap="wrap">
                        {[1, 3, 5].map((tier) =>
                          diff[tier] > 0 ? (
                            <Badge key={tier} colorScheme={DIFF_COLOR[tier]} fontSize="xs">
                              {diff[tier]}
                              {DIFF_LABEL[tier]}
                            </Badge>
                          ) : null
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Box
        mt={8}
        p={5}
        borderRadius="lg"
        bg="whiteAlpha.50"
        borderWidth="1px"
        borderColor="yellow.600"
        w="full"
      >
        <VStack spacing={4} align="center" textAlign="center">
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color="yellow.300">
              Keep the Rush Alive
            </Text>
            <Text fontSize="sm" color="gray.300" maxW="600px">
              Enjoyed the event? I love building these tools for you gamers to keep the OSRS event
              dreams alive. Donations help cover server costs so I can pay more attention to
              building cool stuff, and as a solo dev, every bit counts :3 thank you, love you! -
              Lemon 💛
            </Text>
          </VStack>

          <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
            <PleaseEffect>
              <ChakraLink
                href="https://cash.app/$lemonlikesgirls"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F4D35E',
                  color: '#1a1a1a',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 15,
                }}
                target="_blank"
              >
                <FaHeart size={18} /> Donate (CashApp)
              </ChakraLink>
            </PleaseEffect>
            <PleaseEffect>
              <ChakraLink
                href="https://ko-fi.com/A667UUO"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: 15,
                }}
                target="_blank"
              >
                <FaCoffee size={18} /> Ko-fi
              </ChakraLink>
            </PleaseEffect>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
