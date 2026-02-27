import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Collapse,
  useDisclosure,
  IconButton,
  useColorMode,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaMagic } from 'react-icons/fa';

const getBuffIcon = (buffName = '') => {
  if (buffName.toLowerCase().includes('slayer')) return '⚔️';
  if (buffName.toLowerCase().includes('training')) return '📚';
  if (buffName.toLowerCase().includes('gather')) return '📦';
  if (buffName.toLowerCase().includes('versatile')) return '✨';
  return '🎁';
};

const BuffHistoryPanel = ({ buffHistory = [], nodes = [] }) => {
  const { colorMode } = useColorMode();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const colors = {
    dark: {
      bg: 'gray.800',
      cardBg: 'gray.700',
      text: 'white',
      subtext: 'gray.300',
      border: 'gray.600',
      entryBg: 'purple.900',
      accent: 'purple.300',
    },
    light: {
      bg: 'white',
      cardBg: 'gray.50',
      text: 'gray.800',
      subtext: 'gray.600',
      border: 'gray.200',
      entryBg: 'purple.50',
      accent: 'purple.600',
    },
  };

  const c = colors[colorMode];

  const getNodeTitle = (nodeId) => {
    const node = nodes.find((n) => n.nodeId === nodeId);
    return node?.title || nodeId;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const sorted = useMemo(
    () => [...buffHistory].sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt)),
    [buffHistory]
  );

  if (sorted.length === 0) return null;

  return (
    <Box
      bg={c.cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={c.border}
      overflow="hidden"
      maxW="600px"
      margin="0 auto"
      w="100%"
    >
      {/* Header */}
      <HStack
        p={3}
        bg={c.bg}
        justify="space-between"
        cursor="pointer"
        onClick={onToggle}
        _hover={{ opacity: 0.9 }}
      >
        <HStack spacing={3}>
          <Icon as={FaMagic} color={c.accent} boxSize={4} />
          <VStack align="start" spacing={0}>
            <Text fontWeight="semibold" fontSize="sm" color={c.text}>
              Buff Usage History
            </Text>
            <Text fontSize="xs" color={c.subtext}>
              {sorted.length} buff{sorted.length !== 1 ? 's' : ''} used
            </Text>
          </VStack>
        </HStack>

        <IconButton
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          variant="ghost"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      </HStack>

      {/* Content */}
      <Collapse in={isOpen} animateOpacity>
        <VStack
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4A5568',
              borderRadius: '10px',
              '&:hover': {
                background: '#718096',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#4A5568 transparent',
          }}
          p={3}
          spacing={2}
          align="stretch"
          maxH="300px"
          overflowY="auto"
        >
          {sorted.map((entry, idx) => (
            <Box
              key={entry.buffId ?? idx}
              p={3}
              bg={c.entryBg}
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor={c.accent}
            >
              <HStack justify="space-between" align="start">
                <HStack spacing={2} flex={1}>
                  <Text fontSize="md" lineHeight={1}>
                    {getBuffIcon(entry.buffName)}
                  </Text>
                  <VStack align="start" spacing={0} flex={1}>
                    <HStack flexWrap="wrap" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium" color={c.text}>
                        {entry.buffName}
                      </Text>
                      <Badge colorScheme="purple" fontSize="xs">
                        buff
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color={c.subtext}>
                      on <strong>{getNodeTitle(entry.usedOn)}</strong>
                    </Text>
                    <HStack spacing={1} fontSize="xs" color={c.subtext} mt={0.5}>
                      <Text>{entry.originalRequirement}</Text>
                      <Text>→</Text>
                      <Text color={c.accent} fontWeight="semibold">
                        {entry.reducedRequirement}
                      </Text>
                      <Text>({entry.benefit})</Text>
                    </HStack>
                  </VStack>
                </HStack>
                <Text fontSize="xs" color={c.subtext} whiteSpace="nowrap">
                  {formatTimeAgo(entry.usedAt)}
                </Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default BuffHistoryPanel;
