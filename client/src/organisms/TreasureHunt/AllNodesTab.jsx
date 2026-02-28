import React from 'react';
import {
  Badge,
  Box,
  HStack,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
import { CopyIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { formatObjectiveAmount } from '../../utils/treasureHuntHelpers';
import ScrollableTableContainer from '../../atoms/ScrollableTableContainer';

const COLUMNS = [
  { col: 'id', label: 'ID' },
  { col: 'title', label: 'Title' },
  { col: 'type', label: 'Type' },
  { col: 'difficulty', label: 'Difficulty' },
  { col: 'location', label: 'Location / Path' },
  { col: 'gp', label: 'GP', isNumeric: true },
  { col: 'keys', label: 'Keys' },
  { col: 'buffs', label: 'Buffs' },
  { col: 'objective', label: 'Objective' },
  { col: 'amount', label: 'Amount', isNumeric: true },
  { col: 'prereqs', label: 'Prereqs', isNumeric: true },
  { col: 'unlocks', label: 'Unlocks', isNumeric: true },
];

const formatGPLocal = (gp) => {
  if (!gp) return '0.0M';
  return (gp / 1000000).toFixed(1) + 'M';
};

const AllNodesTab = ({ nodes, nodeSort, onSort, currentColors, colorMode }) => (
  <Box
    bg={currentColors.cardBg}
    borderRadius="8px"
    overflow="hidden"
    sx={{
      '&::-webkit-scrollbar': { width: '8px' },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(125,95,255,0.6)',
        borderRadius: '4px',
        '&:hover': { background: 'rgba(125,95,255,0.8)' },
      },
      scrollbarWidth: 'thin',
      scrollbarColor: `rgba(125,95,255,0.6) rgba(255,255,255,0.1)`,
    }}
  >
    <ScrollableTableContainer width="100%">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {COLUMNS.map(({ col, label, isNumeric }) => (
              <Th
                key={col}
                isNumeric={isNumeric}
                color="gray.600"
                cursor="pointer"
                userSelect="none"
                onClick={() => onSort(col)}
                _hover={{ color: 'gray.700' }}
              >
                <HStack spacing={1} justify={isNumeric ? 'flex-end' : 'flex-start'}>
                  <span>{label}</span>
                  {nodeSort.col === col ? (
                    nodeSort.dir === 'asc' ? (
                      <TriangleUpIcon color="gray.800" boxSize={2.5} />
                    ) : (
                      <TriangleDownIcon color="gray.800" boxSize={2.5} />
                    )
                  ) : (
                    <TriangleDownIcon color="gray.800" boxSize={2.5} opacity={0.2} />
                  )}
                </HStack>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {nodes.map((node) => {
            const diffMap = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };
            const diffBadgeScheme =
              node.difficultyTier === 5
                ? 'red'
                : node.difficultyTier === 3
                ? 'orange'
                : node.difficultyTier === 1
                ? 'green'
                : 'gray';
            const gp = node.rewards?.gp || 0;
            const keys = node.rewards?.keys || [];
            const buffs = node.rewards?.buffs || [];
            const objective = node.objective ? ` ${node.objective.target}` : '—';

            return (
              <Tr key={node.nodeId}>
                <Td>
                  <HStack spacing={2}>
                    <Tooltip label="Copy Node ID">
                      <IconButton
                        aria-label="Copy Node ID"
                        icon={<CopyIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(node.nodeId)}
                      />
                    </Tooltip>
                    <Text
                      color={currentColors.textColor}
                      fontSize="xs"
                      fontFamily="mono"
                    >
                      {node.nodeId}
                    </Text>
                  </HStack>
                </Td>
                <Td color={currentColors.textColor} maxW="280px" isTruncated>
                  {node.title || '—'}
                </Td>
                <Td>
                  <Badge
                    bg={
                      node.nodeType === 'INN'
                        ? 'yellow.300'
                        : node.nodeType === 'START'
                        ? currentColors.purple.base
                        : currentColors.turquoise.base
                    }
                    color="white"
                  >
                    {node.nodeType}
                  </Badge>
                </Td>
                <Td>
                  {node.nodeType === 'STANDARD' ? (
                    <Badge colorScheme={diffBadgeScheme}>
                      {diffMap[node.difficultyTier] || '—'}
                    </Badge>
                  ) : (
                    <Badge colorScheme="gray">—</Badge>
                  )}
                </Td>
                <Td color={currentColors.textColor}>
                  <Text whiteSpace="nowrap" fontSize="sm">
                    {node.mapLocation || '—'}
                  </Text>
                </Td>
                <Td isNumeric color={currentColors.green.base}>
                  {node.nodeType === 'INN' ? (
                    node.availableRewards?.length > 0 ? (
                      <Tooltip label="Inn trade rewards (min - max)">
                        <Text whiteSpace="nowrap">
                          {formatGPLocal(
                            Math.min(...node.availableRewards.map((r) => r.payout))
                          )}{' '}
                          -{' '}
                          {formatGPLocal(
                            Math.max(...node.availableRewards.map((r) => r.payout))
                          )}
                        </Text>
                      </Tooltip>
                    ) : (
                      '—'
                    )
                  ) : gp ? (
                    formatGPLocal(gp)
                  ) : (
                    '0.0M'
                  )}
                </Td>
                <Td>
                  <HStack spacing={1} wrap="wrap">
                    {keys.length > 0 ? (
                      keys.map((k, i) => (
                        <Badge key={i} colorScheme={k.color}>
                          {k.quantity} {k.color}
                        </Badge>
                      ))
                    ) : (
                      <Text fontSize="xs" color="gray.500">
                        —
                      </Text>
                    )}
                  </HStack>
                </Td>
                <Td>
                  {buffs.length > 0 ? (
                    <Badge colorScheme="purple">{buffs.length}</Badge>
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      —
                    </Text>
                  )}
                </Td>
                <Td color={currentColors.textColor} maxW="320px" isTruncated>
                  {objective}
                </Td>
                <Td color={currentColors.textColor} isNumeric>
                  {node?.objective?.appliedBuff ? (
                    <Tooltip
                      hasArrow
                      label={`Reduced from ${(
                        node.objective.originalQuantity ?? node.objective.quantity
                      ).toLocaleString()}`}
                    >
                      <HStack justify="flex-end" spacing={2}>
                        <Text>{formatObjectiveAmount(node)}</Text>
                        <Badge colorScheme="blue">
                          -{(node.objective.appliedBuff.reduction * 100).toFixed(0)}%
                        </Badge>
                      </HStack>
                    </Tooltip>
                  ) : (
                    <Text whiteSpace="nowrap">{formatObjectiveAmount(node)}</Text>
                  )}
                </Td>
                <Td isNumeric color={currentColors.textColor}>
                  {node.prerequisites?.length || 0}
                </Td>
                <Td isNumeric color={currentColors.textColor}>
                  {node.unlocks?.length || 0}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </ScrollableTableContainer>
  </Box>
);

export default AllNodesTab;
